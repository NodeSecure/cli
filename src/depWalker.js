"use strict";

// Require Node.js Dependencies
const os = require("os");
const { join, extname } = require("path");
const { mkdir, readFile, rmdir } = require("fs").promises;
const repl = require("repl");

// Require Third-party Dependencies
const pacote = require("pacote");
const { red, white, yellow, cyan } = require("kleur");
const semver = require("semver");
const Lock = require("@slimio/lock");
const Spinner = require("@slimio/async-cli-spinner");
const isMinified = require("is-minified-code");
const Registry = require("@slimio/npm-registry");
const combineAsyncIterators = require("combine-async-iterators");
const uniqueSlug = require("unique-slug");
const ntlp = require("ntlp");
const iter = require("itertools");
const ms = require("ms");
const difference = require("lodash.difference");

// Require Internal Dependencies
const { getTarballComposition, mergeDependencies, cleanRange, getRegistryURL } = require("./utils");
const { searchRuntimeDependencies } = require("./ast");
const { hydrateNodeSecurePayload } = require("./vulnerabilities");
const Dependency = require("./dependency.class");

// CONSTANTS
const JS_EXTENSIONS = new Set([".js", ".mjs"]);
const EXT_DEPS = new Set(["http", "https", "net", "http2", "dgram"]);
const NPM_SCRIPTS = new Set(["preinstall", "postinstall", "preuninstall", "postuninstall"]);
const NODE_CORE_LIBS = new Set([...repl._builtinLibs, "timers", "module"]);
const TMP = os.tmpdir();
const REGISTRY_DEFAULT_ADDR = getRegistryURL();

// Vars
const tarballLocker = new Lock({ maxConcurrent: 5 });
const npmReg = new Registry(REGISTRY_DEFAULT_ADDR);
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

/**
 * @async
 * @function getExpectedSemVer
 * @param {!string} range SemVer range
 * @returns {string}
 */
async function getExpectedSemVer(range) {
    try {
        const { versions, "dist-tags": { latest } } = await pacote.packument(depName, {
            registry: REGISTRY_DEFAULT_ADDR,
            ...token
        });
        const currVersion = semver.maxSatisfying(Object.keys(versions), range);

        return currVersion === null ? latest : currVersion;
    }
    catch (err) {
        return cleanRange(range);
    }
}

async function getCleanDependencyName([depName, range]) {
    const depVer = await getExpectedSemVer(range);

    return [`${depName}@${range}`, `${depName}@${depVer}`];
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
 * @param {!string} packageName packageName (and version)
 * @param {string} [gitURL]
 * @param {depConfiguration} [options={}] options
 * @returns {AsyncIterableIterator<NodeSecure.Dependency>}
 */
async function* searchDeepDependencies(packageName, gitURL, options = {}) {
    const isGit = typeof gitURL === "string";
    const { exclude = new Map(), currDepth = 0, parent, maxDepth = 4 } = options;

    const { name, version, deprecated, ...pkg } = await pacote.manifest(isGit ? gitURL : packageName, {
        ...token,
        registry: REGISTRY_DEFAULT_ADDR,
        cache: `${process.env.HOME}/.npm`
    });
    const { dependencies, customResolvers } = mergeDependencies(pkg);
    if (dependencies.size > 0) {
        parent.hasIndirectDependencies = true;
    }

    const current = new Dependency(name, version, parent);
    if (isGit) {
        current.isGit(gitURL);
    }
    current.isDeprecated = deprecated === true;
    current.hasCustomResolver = customResolvers.size > 0;
    current.hasDependencies = dependencies.size > 0;

    if (currDepth !== maxDepth) {
        const config = {
            exclude, currDepth: currDepth + 1, parent: current, maxDepth
        };

        const gitDependencies = iter.filter(customResolvers.entries(), ([, valueStr]) => valueStr.startsWith("git+"));
        for (const [depName, valueStr] of gitDependencies) {
            yield* searchDeepDependencies(depName, valueStr.slice(4), config);
        }

        const depsNames = await Promise.all(iter.map(dependencies.entries(), getCleanDependencyName));
        for (const [fullName, cleanName] of depsNames) {
            if (exclude.has(cleanName)) {
                exclude.get(cleanName).add(current.fullName);
            }
            else {
                exclude.set(cleanName, new Set());
                yield* searchDeepDependencies(fullName, void 0, config);
            }
        }
    }

    yield current;
}

/**
 * @async
 * @function processPackageTarball
 * @param {!string} name package name
 * @param {!string} version package version
 * @param {object} options
 * @param {*} [options.ref] version ref
 * @param {string} [options.tmpLocation] temp location
 * @returns {Promise<void>}
 */
async function processPackageTarball(name, version, options) {
    const { ref, tmpLocation } = options;

    const dest = join(tmpLocation, `${name}@${version}`);
    const free = await tarballLocker.acquireOne();

    try {
        await pacote.extract(ref.flags.isGit ? ref.gitUrl : `${name}@${version}`, dest, {
            ...token,
            registry: REGISTRY_DEFAULT_ADDR,
            cache: `${process.env.HOME}/.npm`
        });
        await new Promise((resolve) => setImmediate(resolve));
        let isProjectUsingESM = false;
        let depsInLocalPackage = null;
        let devDepsInLocalPackage = [];

        // Read the package.json file in the extracted tarball
        try {
            const packageStr = await readFile(join(dest, "package.json"), "utf-8");
            const {
                type = "script", description = "", author = {}, scripts = {}, dependencies = {}, devDependencies = {}
            } = JSON.parse(packageStr);
            ref.description = description;
            ref.author = author;
            isProjectUsingESM = type === "module";
            depsInLocalPackage = Object.keys(dependencies);
            devDepsInLocalPackage = Object.keys(devDependencies);

            ref.flags.hasScript = [...Object.keys(scripts)].some((value) => NPM_SCRIPTS.has(value.toLowerCase()));
        }
        catch (err) {
            ref.flags.hasManifest = false;
        }

        // Get the composition of the extracted tarball
        const { ext, files, size } = await getTarballComposition(dest);
        ref.size = size;
        ref.composition.extensions.push(...ext);
        ref.composition.files.push(...files);

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

                const usingECMAModules = extname(file) === ".mjs" ? true : isProjectUsingESM;
                const { dependencies: deps, isSuspect } = searchRuntimeDependencies(str, usingECMAModules);
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

        if (depsInLocalPackage !== null) {
            const thirdPartyDependencies = required
                .map((name) => (depsInLocalPackage.includes(name) ? name : name.split("/", 1)[0]))
                .filter((name) => !name.startsWith("."))
                .filter((name) => !NODE_CORE_LIBS.has(name))
                .filter((name) => !devDepsInLocalPackage.includes(name));

            const unusedDeps = difference(depsInLocalPackage, thirdPartyDependencies);
            const missingDeps = difference(thirdPartyDependencies, depsInLocalPackage);
            ref.flags.hasMissingOrUnusedDependency = unusedDeps.length > 0 || missingDeps.length > 0;
            ref.composition.unused.push(...unusedDeps);
            ref.composition.missing.push(...missingDeps);
        }

        ref.composition.required.push(...required);
        ref.composition.required_builtin = required.filter((name) => NODE_CORE_LIBS.has(name));

        const hasExternal = ref.composition.required_builtin.some((depName) => EXT_DEPS.has(depName));
        ref.flags.hasExternalCapacity = hasExternal;

        ref.flags.hasMinifiedCode = ref.composition.minified.length > 0;
        if (ref.flags.hasSuspectImport) {
            ref.composition.suspectFiles = suspectFiles;
        }

        await new Promise((resolve) => setImmediate(resolve));
        const licenses = await ntlp(dest);
        ref.flags.hasLicense = licenses.uniqueLicenseIds.length > 0;
        ref.flags.hasMultipleLicenses = licenses.hasMultipleLicenses;
        ref.license = licenses;
        ref.license.uniqueLicenseIds = licenses.uniqueLicenseIds;
    }
    catch (err) {
        ref.flags.hasLicense = true;
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
async function* getRootDependencies(manifest, options = Object.create(null)) {
    const { maxDepth = 4, exclude } = options;

    const { dependencies, customResolvers } = mergeDependencies(manifest, void 0);
    const parent = new Dependency(manifest.name, manifest.version);
    parent.hasCustomResolver = customResolvers.size > 0;
    parent.hasDependencies = dependencies.size > 0;

    const configRef = { exclude, maxDepth, parent };
    const iterators = [
        ...iter.filter(customResolvers.entries(), ([, valueStr]) => valueStr.startsWith("git+"))
            .map(([depName, valueStr]) => searchDeepDependencies(depName, valueStr.slice(4), configRef)),
        ...iter.map(dependencies.entries(), ([name, ver]) => searchDeepDependencies(`${name}@${ver}`, void 0, configRef))
    ];

    for await (const dep of combineAsyncIterators(...iterators)) {
        yield dep;
    }
    yield parent;

    // Add root dependencies to the exclude Map (because the parent is not handled by searchDeepDependencies)
    // if we skip this the code will fail to re-link properly dependencies in the following steps
    const depsName = await Promise.all(iter.map(dependencies.entries(), getCleanDependencyName));
    for (const [, fullRange] of depsName) {
        if (exclude.has(fullRange)) {
            exclude.get(fullRange).add(parent.fullName);
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

    // Create TMP directory
    const tmpLocation = join(TMP, uniqueSlug());
    await mkdir(tmpLocation, { recursive: true });

    const spinner = new Spinner({
        spinner: "dots",
        verbose
    }).start(white().bold("Fetching all dependencies ..."));

    /** @type {Map<string, NodeSecure.Payload>} */
    const flattenedDeps = new Map();
    const promisesToWait = [];

    // We are dealing with an exclude Map to avoid checking a package more than one time in searchDeepDependencies
    const exclude = new Map();

    for await (const currentDep of getRootDependencies(manifest, { maxDepth: options.maxDepth, exclude })) {
        const { name, version } = currentDep;
        const current = currentDep.flatten(name === manifest.name ? 0 : void 0);

        // Note: These are not very well handled in my opinion (not so much lazy ...).
        promisesToWait.push(searchPackageAuthors(name, current.metadata));
        promisesToWait.push(processPackageTarball(name, version, {
            ref: current[version],
            tmpLocation
        }));

        if (flattenedDeps.has(name)) {
            // TODO: how to handle different metadata ?
            const dep = flattenedDeps.get(name);

            const currVersion = current.versions[0];
            if (!Reflect.has(dep, currVersion)) {
                dep[currVersion] = current[currVersion];
                dep.versions.push(currVersion);
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
        const execTime = cyan().bold(ms(spinner.elapsedTime.toFixed(2)));
        spinner.succeed(white().bold(`Successfully fetched and processed all stats in ${execTime}`));
    }
    catch (err) {
        spinner.fail(red().bold(err.message));

        return null;
    }

    // Search for vulnerabilities in the local .json db
    await hydrateNodeSecurePayload(flattenedDeps);

    // We do this because it "seem" impossible to link all dependencies in the first walk.
    // Because we are dealing with package only one time it may happen sometimes.
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

    // Cleanup tmpLocation dir
    try {
        await new Promise((resolve) => setImmediate(resolve));
        await rmdir(tmpLocation, { recursive: true });
    }
    catch (err) {
        console.log(red().bold(`Failed to remove directory ${yellow().bold(tmpLocation)}`));
    }
    if (verbose) {
        console.log("");
    }

    return flattenedDeps;
}

module.exports = { depWalker };
