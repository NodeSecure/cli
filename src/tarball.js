"use strict";

// Require Node.js Dependencies
const { join, extname, dirname } = require("path");
const fs = require("fs").promises;
const os = require("os");
const { promisify } = require("util");

// Require Third-party Dependencies
const difference = require("lodash.difference");
const isMinified = require("is-minified-code");
const pacote = require("pacote");
const ntlp = require("ntlp");
const builtins = require("builtins");
const { runASTAnalysis } = require("js-x-ray");

// Require Internal Dependencies
const {
    getTarballComposition, isSensitiveFile, getPackageName, constants
} = require("./utils");

// VARS
const nextTick = promisify(setImmediate);

// CONSTANTS
const DIRECT_PATH = new Set([".", "..", "./", "../"]);
const NATIVE_CODE_EXTENSIONS = new Set([".gyp", ".c", ".cpp", ".node", ".so", ".h"]);
const NATIVE_NPM_PACKAGES = new Set(["node-gyp", "node-pre-gyp", "node-gyp-build", "node-addon-api"]);
const NODE_CORE_LIBS = new Set(builtins());

async function readTarballManifest(dest, ref) {
    try {
        const packageStr = await fs.readFile(join(dest, "package.json"), "utf-8");
        const {
            description = "", author = {}, scripts = {}, dependencies = {}, devDependencies = {}, gypfile = false
        } = JSON.parse(packageStr);

        ref.description = description;
        ref.author = author;
        ref.flags.hasScript = [...Object.keys(scripts)]
            .some((value) => constants.NPM_SCRIPTS.has(value.toLowerCase()));

        return {
            packageDeps: [...Object.keys(dependencies)],
            packageDevDeps: Object.keys(devDependencies),
            packageGyp: gypfile
        };
    }
    catch {
        ref.flags.hasManifest = false;

        return { packageDeps: null, packageDevDeps: [], packageGyp: false };
    }
}

async function executeJSXRayAnalysisOnFile(dest, file, options) {
    const { name, ref } = options;

    try {
        const str = await fs.readFile(join(dest, file), "utf-8");
        const isMin = file.includes(".min") || isMinified(str);

        const ASTAnalysis = runASTAnalysis(str, { isMinified: isMin });
        ASTAnalysis.dependencies.removeByName(name);

        const dependencies = [];
        const filesDependencies = [];
        for (const depName of ASTAnalysis.dependencies) {
            if (depName.startsWith(".")) {
                const indexName = DIRECT_PATH.has(depName) ? join(depName, "index.js") : join(dirname(file), depName);
                filesDependencies.push(indexName);
            }
            else {
                dependencies.push(depName);
            }
        }
        const inTryDeps = [...ASTAnalysis.dependencies.getDependenciesInTryStatement()];

        if (!ASTAnalysis.isOneLineRequire && isMin) {
            ref.composition.minified.push(file);
        }
        ref.warnings.push(...ASTAnalysis.warnings.map((curr) => Object.assign({}, curr, { file })));

        return { inTryDeps, dependencies, filesDependencies };
    }
    catch (error) {
        if (!("code" in error)) {
            ref.warnings.push({ file, kind: "parsing-error", value: error.message, location: [[0, 0], [0, 0]] });
            ref.flags.hasWarnings = true;
        }

        return null;
    }
}

async function analyzeDirOrArchiveOnDisk(name, version, options) {
    const { ref, tmpLocation, tarballLocker } = options;

    const isNpmTarball = !(tmpLocation === null);
    const dest = isNpmTarball ? join(tmpLocation, `${name}@${version}`) : process.cwd();
    const free = await tarballLocker.acquireOne();

    try {
        // If this is an NPM tarball then we extract it on the disk with pacote.
        if (isNpmTarball) {
            await pacote.extract(ref.flags.isGit ? ref.gitUrl : `${name}@${version}`, dest, {
                ...constants.NPM_TOKEN, registry: constants.DEFAULT_REGISTRY_ADDR, cache: `${os.homedir()}/.npm`
            });
            await nextTick();
        }

        // Read the package.json at the root of the directory or archive.
        const { packageDeps, packageDevDeps, packageGyp } = await readTarballManifest(dest, ref);

        // Get the composition of the (extracted) directory
        const { ext, files, size } = await getTarballComposition(dest);
        ref.size = size;
        ref.composition.extensions.push(...ext);
        ref.composition.files.push(...files);
        ref.flags.hasBannedFile = files.some((path) => isSensitiveFile(path));

        // Search for minified and runtime dependencies
        // Run a JS-X-Ray analysis on each JavaScript files of the project!
        const [dependencies, filesDependencies, inTryDeps] = [new Set(), new Set(), new Set()];
        const fileAnalysisResults = await Promise.all(
            files
                .filter((name) => constants.EXT_JS.has(extname(name)))
                .map((file) => executeJSXRayAnalysisOnFile(dest, file, { name, ref }))
        );

        for (const result of fileAnalysisResults.filter((row) => row !== null)) {
            result.inTryDeps.forEach((dep) => inTryDeps.add(dep));
            result.dependencies.forEach((dep) => dependencies.add(dep));
            result.filesDependencies.forEach((dep) => filesDependencies.add(dep));
        }

        // Search for native code
        {
            const hasNativeFile = files.some((file) => NATIVE_CODE_EXTENSIONS.has(extname(file)));
            const hasNativePackage = hasNativeFile ? null : [
                ...new Set([...packageDevDeps, ...(packageDeps || [])])
            ].some((pkg) => NATIVE_NPM_PACKAGES.has(pkg));
            ref.flags.hasNativeCode = hasNativeFile || hasNativePackage || packageGyp;
        }

        ref.flags.hasWarnings = ref.warnings.length > 0;
        const required = [...dependencies];

        if (packageDeps !== null) {
            const thirdPartyDependencies = required
                .map((name) => (packageDeps.includes(name) ? name : getPackageName(name)))
                .filter((name) => !name.startsWith("."))
                .filter((name) => !NODE_CORE_LIBS.has(name))
                .filter((name) => !packageDevDeps.includes(name))
                .filter((name) => !inTryDeps.has(name));
            ref.composition.required_thirdparty = thirdPartyDependencies;

            const unusedDeps = difference(
                packageDeps.filter((name) => !name.startsWith("@types")), thirdPartyDependencies);
            const missingDeps = new Set(difference(thirdPartyDependencies, packageDeps));

            ref.flags.hasMissingOrUnusedDependency = unusedDeps.length > 0 || missingDeps.length > 0;
            ref.composition.unused.push(...unusedDeps);
            ref.composition.missing.push(...missingDeps);
        }

        ref.composition.required_files = [...filesDependencies]
            .filter((depName) => depName.trim() !== "")
            // .map((depName) => {
            //     return files.includes(depName) ? depName : join(depName, "index.js");
            // })
            .map((depName) => (extname(depName) === "" ? `${depName}.js` : depName));
        ref.composition.required_nodejs = required.filter((name) => NODE_CORE_LIBS.has(name));
        ref.flags.hasExternalCapacity = ref.composition.required_nodejs
            .some((depName) => constants.EXT_DEPS.has(depName));
        ref.flags.hasMinifiedCode = ref.composition.minified.length > 0;

        // License
        await nextTick();
        const licenses = await ntlp(dest);

        const uniqueLicenseIds = Array.isArray(licenses.uniqueLicenseIds) ? licenses.uniqueLicenseIds : [];
        ref.flags.hasLicense = uniqueLicenseIds.length > 0;
        ref.flags.hasMultipleLicenses = licenses.hasMultipleLicenses;
        ref.license = licenses;
        ref.license.uniqueLicenseIds = uniqueLicenseIds;
    }
    catch (err) {
        ref.flags.hasLicense = true;
    }
    finally {
        free();
    }
}

module.exports = {
    analyzeDirOrArchiveOnDisk
};
