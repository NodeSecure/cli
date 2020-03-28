"use strict";

// Require Node.js Dependencies
const os = require("os");
const { join, extname } = require("path");
const { readFile, rmdir } = require("fs").promises;
const { promisify } = require("util");

// Require Third-party Dependencies
const pacote = require("pacote");
const uniqueSlug = require("unique-slug");
const { searchRuntimeDependencies } = require("js-x-ray");
const ntlp = require("ntlp");
const isMinified = require("is-minified-code");
const clonedeep = require("lodash.clonedeep");

// Require Internal Dependencies
const { depWalker } = require("./src/depWalker");
const { getRegistryURL, getTarballComposition } = require("./src/utils");

// CONSTANTS
const TMP = os.tmpdir();
const REGISTRY_DEFAULT_ADDR = getRegistryURL();
const JS_EXTENSIONS = new Set([".js", ".mjs"]);

// VARS
const nextTick = promisify(setImmediate);

async function cwd(cwd = process.cwd(), options) {
    const packagePath = join(cwd, "package.json");
    const str = await readFile(packagePath, "utf-8");

    return depWalker(JSON.parse(str), options);
}

async function from(packageName, options) {
    const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};
    const manifest = await pacote.manifest(packageName, token);

    return depWalker(manifest, options);
}

async function readJSFile(dest, file) {
    const str = await readFile(join(dest, file), "utf-8");

    return [file, str];
}

async function verify(packageName) {
    const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};
    const tmpLocation = join(TMP, uniqueSlug());
    const dest = join(tmpLocation, packageName);

    try {
        await pacote.extract(packageName, dest, {
            ...token, registry: REGISTRY_DEFAULT_ADDR, cache: `${process.env.HOME}/.npm`
        });

        // Read the package.json file inside the extracted directory.
        let isProjectUsingESM = false;
        {
            const packageStr = await readFile(join(dest, "package.json"), "utf-8");
            const { type = "script" } = JSON.parse(packageStr);
            isProjectUsingESM = type === "module";
        }

        // Get the tarball composition
        await nextTick();
        const { ext, files, size } = await getTarballComposition(dest);

        // Search for runtime dependencies
        const dependencies = Object.create(null);
        const minified = [];
        const warnings = [];

        const JSFiles = files.filter((name) => JS_EXTENSIONS.has(extname(name)));
        const allFilesContent = (await Promise.allSettled(JSFiles.map((file) => readJSFile(dest, file))))
            .filter((_p) => _p.status === "fulfilled").map((_p) => _p.value);

        // TODO: 1) add dependency location, 2) handle dependency by file to not loose data.
        for (const [file, str] of allFilesContent) {
            const ASTAnalysis = searchRuntimeDependencies(str, {
                module: extname(file) === ".mjs" ? true : isProjectUsingESM
            });
            ASTAnalysis.dependencies.removeByName(packageName);
            Object.assign(dependencies, clonedeep(ASTAnalysis.dependencies.dependencies));
            warnings.push(...ASTAnalysis.warnings);

            if (!ASTAnalysis.isOneLineRequire && !file.includes(".min") && isMinified(str)) {
                minified.push(file);
            }
        }

        await nextTick();
        const licenses = await ntlp(dest);

        return {
            files: { list: files, extensions: ext, minified },
            directorySize: size, licenses,
            ast: { dependencies, warnings }
        };
    }
    finally {
        await nextTick();
        await rmdir(tmpLocation, { recursive: true });
    }
}

module.exports = {
    cwd, from, verify
};
