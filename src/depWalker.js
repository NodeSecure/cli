"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const fs = require("fs");
const { mkdir, readFile } = require("fs").promises;
const { performance } = require("perf_hooks");
const repl = require("repl");

// Require Third-party Dependencies
const pacote = require("pacote");
const { red, white, yellow, cyan } = require("kleur");
const premove = require("premove");
const semver = require("semver");
const Lock = require("@slimio/lock");
const Spinner = require("@slimio/async-cli-spinner");
const isMinified = require("is-minified-code");
const Registry = require("@slimio/npm-registry");
const combineAsyncIterators = require("combine-async-iterators");
const git = require("isomorphic-git");
git.plugins.set("fs", fs);

// Require Internal Dependencies
const { getTarballComposition, mergeDependencies, getLicenseFromString, cleanRange } = require("./utils");
const { searchRuntimeDependencies } = require("./ast");
const Dependency = require("./dependency.class");

// CONSTANTS
const JS_EXTENSIONS = new Set([".js", ".mjs"]);
const NODE_CORE_LIBS = new Set([...repl._builtinLibs]);
const TMP = join(__dirname, "..", "tmp");

// Vars
const tarballLocker = new Lock({ max: 25 });
const npmReg = new Registry();
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

/**
 * @async
 * @function getExpectedSemVer
 * @param {!string} range SemVer range
 * @returns {string}
 */
async function getExpectedSemVer(range) {
    try {
        const { versions, "dist-tags": { latest } } = await pacote.packument(depName, token);
        const currVersion = semver.maxSatisfying(Object.keys(versions), range);

        return currVersion === null ? latest : currVersion;
    }
    catch (err) {
        return cleanRange(range);
    }
}

/**
 * @typedef {object} depConfiguration
 * @property {Map<string, Set<string>>} exclude
 * @property {number} currDepth
 * @property {number} maxDepth
 * @property {Dependency} parent
 */

/**
 * @async
 * @generator
 * @function searchDeepDependencies
 * @param {Map<string, string>} dependencies package dependencies
 * @param {Map<string, string>} customResolvers custom resolvers
 * @param {depConfiguration} [options] options
 * @returns {AsyncIterableIterator<NodeSecure.Dependency>}
 */
async function* searchDeepDependencies(dependencies, customResolvers, options) {
    const { exclude, fullName } = options;

    for (const [depName, valueStr] of customResolvers.entries()) {
        if (valueStr.startsWith("git+")) {
            yield* searchGitDependencies(depName, valueStr.slice(4), options);
        }
    }

    for (const [depName, range] of dependencies.entries()) {
        const depVer = await getExpectedSemVer(range);
        const cleanName = `${depName}@${depVer === null ? latest : depVer}`;
        if (exclude.has(cleanName)) {
            exclude.get(cleanName).add(fullName);
        }
        else {
            exclude.set(cleanName, new Set());
            yield* searchNpmDependencies(`${depName}@${range}`, options);
        }
    }
}

/**
 * @async
 * @generator
 * @function searchNpmDependencies
 * @param {!string} packageName packageName (and version)
 * @param {depConfiguration} [options={}] options
 * @returns {AsyncIterableIterator<NodeSecure.Dependency>}
 */
async function* searchNpmDependencies(packageName, options = {}) {
    const { exclude = new Map(), currDepth = 0, parent, maxDepth = 4 } = options;

    const { name, version, deprecated, ...pkg } = await pacote.manifest(packageName, token);
    const { dependencies, customResolvers } = mergeDependencies(pkg);
    if (dependencies.size > 0 && parent instanceof Dependency) {
        parent.hasIndirectDependencies = true;
    }

    const current = new Dependency(name, version, parent);
    current.isDeprecated = deprecated === true;
    current.hasCustomResolver = customResolvers.size > 0;
    current.hasDependencies = dependencies.size > 0;

    if (currDepth !== maxDepth) {
        const opt = {
            exclude, currDepth: currDepth + 1, parent: current, maxDepth, fullName: `${name} ${version}`
        };
        yield* searchDeepDependencies(dependencies, customResolvers, opt);
    }

    yield current;
}

/**
 * @async
 * @function searchGitDependencies
 * @param {!string} name name
 * @param {!string} url url
 * @param {depConfiguration} options options
 * @returns {AsyncIterableIterator<any>}
 */
async function* searchGitDependencies(name, url, options = {}) {
    try {
        const { exclude = new Map(), currDepth = 0, parent, maxDepth = 4 } = options;

        // Clone repository
        const dir = join(TMP, `git@${name}`);
        await git.clone({
            dir, url, singleBranch: true
        });
        await new Promise((resolve) => setImmediate(resolve));

        // Parse Manifest
        const packageStr = await readFile(join(dir, "package.json"), "utf-8");
        const { version, ...pkg } = JSON.parse(packageStr);

        // Retrieve dependencies
        const { dependencies, customResolvers } = mergeDependencies(pkg);
        if (dependencies.size > 0 && parent instanceof Dependency) {
            parent.hasIndirectDependencies = true;
        }

        const current = new Dependency(name, version, parent).isGit();
        current.hasCustomResolver = customResolvers.size > 0;
        current.hasDependencies = dependencies.size > 0;

        if (currDepth !== maxDepth) {
            const opt = {
                exclude, currDepth: currDepth + 1, parent: current, maxDepth, fullName: `${name} ${version}`
            };
            yield* searchDeepDependencies(dependencies, customResolvers, opt);
        }

        yield current;
    }
    catch (err) {
        // Ignore
    }
}

/**
 * @async
 * @function processPackageTarball
 * @param {!string} name package name
 * @param {!string} version package version
 * @param {*} ref version ref
 * @returns {Promise<void>}
 */
async function processPackageTarball(name, version, ref) {
    const dest = ref.flags.isGit ? join(TMP, `git@${name}`) : join(TMP, `${name}@${version}`);
    const free = await tarballLocker.lock();

    try {
        if (!ref.flags.isGit) {
            await pacote.extract(`${name}@${version}`, dest, token);
            await new Promise((resolve) => setImmediate(resolve));
        }

        let license = "N/A";

        // Read the package.json file in the extracted tarball
        try {
            const packageStr = await readFile(join(dest, "package.json"), "utf-8");
            const { description = "", author = {}, ...others } = JSON.parse(packageStr);
            ref.description = description;
            ref.author = author;
            license = others.license || "N/A";
        }
        catch (err) {
            ref.flags.hasManifest = false;
        }

        // Get the composition of the extracted tarball
        const { ext, files, size } = await getTarballComposition(dest);
        ref.size = size;
        ref.composition.extensions.push(...ext);
        ref.composition.files.push(...files);

        // Search for a LICENSE file
        const licenseFile = files.find((value) => value.toLowerCase().includes("license"));
        if (typeof licenseFile !== "undefined") {
            const str = await readFile(join(dest, licenseFile), "utf-8");
            const licenseName = getLicenseFromString(str);
            if (licenseName !== "Unknown License") {
                license = licenseName;
                ref.licenseFrom = licenseFile;
            }
        }
        ref.flags.hasLicense = typeof licenseFile !== "undefined" || license !== "N/A";
        ref.license = license;

        // Search for minified and runtime dependencies
        const jsFiles = files.filter((name) => JS_EXTENSIONS.has(extname(name)));
        const dependencies = [];
        const suspectFiles = [];

        for (const file of jsFiles) {
            try {
                const str = await readFile(join(dest, file), "utf-8");
                if (!file.includes(".min") && isMinified(str)) {
                    ref.composition.minified.push(file);
                }

                const { dependencies: deps, isSuspect } = searchRuntimeDependencies(str);
                dependencies.push(...deps);
                if (isSuspect) {
                    suspectFiles.push(file);
                    ref.flags.hasSuspectImport = isSuspect;
                }
            }
            catch (err) {
                // Ignore
            }
        }

        const required = [...new Set(dependencies)];
        ref.composition.required.push(...required);
        ref.composition.required_builtin = required.filter((name) => NODE_CORE_LIBS.has(name));
        ref.flags.hasMinifiedCode = ref.composition.minified.length > 0;
        if (ref.flags.hasSuspectImport) {
            ref.composition.suspectFiles = suspectFiles;
        }
    }
    catch (err) {
        // Ignore
    }
    finally {
        free();
    }
}

/**
 * @async
 * @function searchPackageAuthors
 * @param {!string} name package name
 * @param {*} ref ref
 * @returns {Promise<void>}
 */
async function searchPackageAuthors(name, ref) {
    try {
        const pkg = await npmReg.package(name);
        ref.publishedCount = pkg.versions.length;
        ref.lastUpdateAt = pkg.publishedAt(pkg.lastVersion);
        ref.lastVersion = pkg.lastVersion;
        ref.homepage = pkg.homepage || "";

        if (typeof pkg.author === "undefined") {
            return;
        }
        ref.author = pkg.author.name || pkg.author;

        const authors = [];
        const publishers = new Set();

        for (const verStr of pkg.versions) {
            const version = pkg.version(verStr);
            if (typeof version.npmUser !== "undefined") {
                const npmUser = version.npmUser.name || version.npmUser;
                if (!publishers.has(npmUser)) {
                    publishers.add(npmUser);
                    ref.publishers.push({
                        name: npmUser,
                        version: verStr,
                        firstPublishAt: pkg.publishedAt(verStr)
                    });
                }
            }

            if (typeof version.author === "undefined" || version.author.name === ref.author) {
                continue;
            }
            const name = version.author.name || version.author;
            if (typeof name !== "string") {
                continue;
            }

            ref.hasChangedAuthor = true;
            authors.push({
                name,
                at: pkg.publishedAt(verStr),
                version: verStr
            });
        }

        if (authors.length > 0) {
            ref.authors = authors;
        }
        ref.hasManyPublishers = publishers.size > 1;
    }
    catch (err) {
        // Ignore
    }
}

/**
 * @async
 * @function getRootDependencies
 * @param {any} manifest package manifest
 * @param {object} options options
 * @param {number} [options.maxDepth=4] max depth
 * @param {Map<any, any>} [options.exclude] exclude
 * @returns {AsyncIterableIterator<Dependency>}
 */
async function* getRootDependencies(manifest, options) {
    const { maxDepth = 4, exclude } = options;

    const { dependencies, customResolvers } = mergeDependencies(manifest, void 0);
    const parent = new Dependency(manifest.name, manifest.version);
    parent.hasDependencies = true;

    // Handle root custom resolvers!
    const iterators = [];
    const config = { exclude, maxDepth, parent };
    for (const [depName, valueStr] of customResolvers.entries()) {
        if (valueStr.startsWith("git+")) {
            iterators.push(searchGitDependencies(depName, valueStr.slice(4), config));
        }
    }

    iterators.push(...[...dependencies.entries()]
        .map(([name, ver]) => searchNpmDependencies(`${name}@${ver}`, config))
    );
    for await (const dep of combineAsyncIterators(...iterators)) {
        yield dep;
    }

    yield parent;

    // Re-insert root project dependencies
    const fullName = `${manifest.name} ${manifest.version}`;
    for (const [name, range] of dependencies.entries()) {
        const version = await getExpectedSemVer(range);
        const fullRange = `${name}@${version}`;
        if (exclude.has(fullRange)) {
            exclude.get(fullRange).add(fullName);
        }
    }
}

/**
 * @async
 * @function depWalker
 * @param {object} manifest manifest (package.json)
 * @param {object} options options
 * @param {boolean} [options.verbose=true] enable verbose mode
 * @param {number} [options.maxDepth=2] max depth
 * @returns {Promise<null|Map<string, NodeSecure.Dependency>>}
 */
async function depWalker(manifest, options = Object.create(null)) {
    const { verbose = true } = options;
    pacote.clearMemoized();

    // Create TMP directory
    await mkdir(TMP, { recursive: true });

    const start = performance.now();
    const spinner = new Spinner({
        spinner: "dots",
        verbose
    }).start(white().bold("Fetching all dependencies ..."));

    /** @type {Map<string, NodeSecure.Payload>} */
    const flattenedDeps = new Map();
    const promisesToWait = [];
    const exclude = new Map();

    for await (const currentDep of getRootDependencies(manifest, { maxDepth: options.maxDepth, exclude })) {
        const { name, version } = currentDep;
        const current = currentDep.flatten(name === manifest.name ? 0 : void 0);

        // Note: These are not very well handled in my opinion (not so much lazy ...).
        promisesToWait.push(searchPackageAuthors(name, current.metadata));
        promisesToWait.push(processPackageTarball(name, version, current[version]));

        if (flattenedDeps.has(name)) {
            // Merge all versions, and always force hasIndirectDependencies to true
            const dep = flattenedDeps.get(name);
            const hasIndirectDependencies = Reflect.has(dep, version) ? dep[version].flags.hasIndirectDependencies : false;

            // Note: here we get "ref" for hasIndirectDependencies (but Object.assign still need to be executed outside of the if).
            const ref = Object.assign(dep, current);
            if (hasIndirectDependencies) {
                ref[version].flags.hasIndirectDependencies = true;
            }
        }
        else {
            flattenedDeps.set(name, current);
        }
    }

    // Wait for all extraction to be done!
    spinner.text = white().bold("Waiting to fetch all packages stats...");
    try {
        await Promise.all(promisesToWait);
        const execTime = cyan().bold((performance.now() - start).toFixed(2));
        spinner.succeed(white().bold(`Successfully fetched and processed all stats in ${execTime} ms`));
    }
    catch (err) {
        spinner.fail(red().bold(err.message));

        return null;
    }

    // Search for vulnerabilities in the local .json db
    try {
        const buf = await readFile(join(__dirname, "..", "vuln.json"));
        const vulnerabilities = JSON.parse(buf.toString());

        const currThreeNames = new Set([...flattenedDeps.keys()]);
        const filtered = new Set(
            Object.keys(vulnerabilities).filter((name) => currThreeNames.has(name))
        );

        for (const name of filtered) {
            // TODO: only push if vulnerable_versions match one of the three version
            flattenedDeps.get(name).vulnerabilities = vulnerabilities[name];
        }
    }
    catch (err) {
        // Ignore
    }

    // Handle excluded dependencies
    // Note: We do this because it "seem" (to me) impossible to link all dependencies in the first walk.
    for (const [packageName, descriptor] of flattenedDeps) {
        const { metadata, ...versions } = descriptor;

        for (const verStr of Object.keys(versions)) {
            const fullName = `${packageName}@${verStr}`;
            const usedDeps = exclude.get(fullName) || new Set();
            if (usedDeps.size === 0) {
                continue;
            }

            const usedBy = {};
            for (const dep of usedDeps) {
                const [name, version] = dep.split(" ");
                usedBy[name] = version;
            }
            Object.assign(versions[verStr].usedBy, usedBy);
        }
    }

    // Cleanup TMP dir
    try {
        await premove(TMP);
    }
    catch (err) {
        console.log(red().bold(`Failed to remove directory ${yellow().bold(TMP)}`));
    }
    console.log("");

    return flattenedDeps;
}

module.exports = { depWalker };
