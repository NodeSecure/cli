"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const { mkdir, readFile } = require("fs").promises;
const { performance } = require("perf_hooks");
const repl = require("repl");

// Require Third-party Dependencies
const pacote = require("pacote");
const { red, white, yellow, cyan } = require("kleur");
const premove = require("premove");
const Lock = require("@slimio/lock");
const Spinner = require("@slimio/async-cli-spinner");
const isMinified = require("is-minified-code");
const Registry = require("@slimio/npm-registry");
const combineAsyncIterators = require("combine-async-iterators");

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

/**
 * @async
 * @generator
 * @func searchDeepDependencies
 * @param {!String} packageName packageName (and version)
 * @param {Object} [options={}] options
 * @param {Map<String, String[]>} [options.exclude] packages that are excluded (avoid infinite recursion).
 * @param {Number} [options.currDepth=0] current depth
 * @param {Dependency} [options.parent] parent dependency
 * @param {Number} [options.maxDepth=2] max depth
 * @returns {AsyncIterableIterator<NodeSecure.Dependency[]>}
 */
async function* searchDeepDependencies(packageName, options = {}) {
    const { exclude = new Map(), currDepth = 0, parent, maxDepth = 2 } = options;

    const { name, version, deprecated, ...pkg } = await pacote.manifest(packageName);
    const { dependencies, customResolvers } = mergeDependencies(pkg);
    if (dependencies.size > 0 && parent instanceof Dependency) {
        parent.hasIndirectDependencies = true;
    }

    const current = new Dependency(name, version, parent);
    current.isDeprecated = deprecated === true;
    current.hasCustomResolver = customResolvers.size > 0;
    current.hasDependencies = dependencies.size > 0;

    if (dependencies.size !== 0 && currDepth !== maxDepth) {
        const opt = { exclude, currDepth: currDepth + 1, parent: current, maxDepth };
        for (const [depName, range] of dependencies.entries()) {
            const cleanName = `${depName}@${cleanRange(range)}`;
            if (exclude.has(cleanName)) {
                exclude.get(cleanName).add(`${name} ${version}`);
            }
            else {
                exclude.set(cleanName, new Set());
                yield* searchDeepDependencies(`${depName}@${range}`, opt);
            }
        }
    }

    yield current;
}

/**
 * @async
 * @func processPackageTarball
 * @param {!String} name package name
 * @param {!String} version package version
 * @param {*} ref version ref
 * @returns {Promise<void>}
 */
async function processPackageTarball(name, version, ref) {
    const fullName = `${name}@${version}`;
    const dest = join(TMP, fullName);
    const free = await tarballLocker.lock();

    try {
        await pacote.extract(fullName, dest);

        /** @type {String} */
        let license;
        try {
            const packageStr = await readFile(join(dest, "package.json"), "utf-8");
            const { description = "", author = {}, ...others } = JSON.parse(packageStr);
            ref.description = description;
            ref.author = author;
            license = others.license || "N/A";
        }
        catch (err) {
            ref.flags.hasManifest = false;
            ref.description = "";
            ref.author = "N/A";
        }

        const { ext, files, size } = await getTarballComposition(dest);
        ref.size = size;
        ref.composition = { extensions: [...ext], files };
        ref.licenseFrom = "package.json";

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
        ref.composition.minified = [];

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
        ref.composition.required = required;
        ref.composition.required_builtin = required.filter((name) => NODE_CORE_LIBS.has(name));
        ref.flags.hasMinifiedCode = ref.composition.minified.length > 0;
        if (ref.flags.hasSuspectImport) {
            ref.composition.suspectFiles = suspectFiles;
        }

        // wait for to the next iteration (avoid lock).
        await new Promise((resolve) => setImmediate(resolve));
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
 * @func getRootDependencies
 * @param {any} manifest package manifest
 * @param {Object} options options
 * @param {Number} [options.maxDepth=2] max depth
 * @param {Map<any, any>} [options.exclude] exclude
 * @returns {AsyncIterableIterator<Dependency>}
 */
async function* getRootDependencies(manifest, options) {
    const { maxDepth = 2, exclude } = options;

    const { dependencies } = mergeDependencies(manifest);
    const parent = new Dependency(manifest.name, manifest.version);
    parent.hasDependencies = true;

    const iterators = [...dependencies.entries()]
        .map(([name, ver]) => searchDeepDependencies(`${name}@${ver}`, { exclude, maxDepth, parent }));
    for await (const dep of combineAsyncIterators(...iterators)) {
        yield dep;
    }

    yield parent;

    // Re-insert root project dependencies
    const fullName = `${manifest.name} ${manifest.version}`;
    for (const [name, version] of dependencies.entries()) {
        const fullRange = `${name}@${cleanRange(version)}`;
        if (exclude.has(fullRange)) {
            exclude.get(fullRange).add(fullName);
        }
    }
}

/**
 * @async
 * @func searchPackageAuthors
 * @param {!String} name package name
 * @param {*} ref ref
 * @returns {Promise<void>}
 */
async function searchPackageAuthors(name, ref) {
    try {
        const pkg = await npmReg.package(name);
        ref.publishedCount = pkg.versions.length;
        ref.lastUpdateAt = pkg.publishedAt(pkg.lastVersion);
        ref.lastVersion = pkg.lastVersion;
        ref.hasChangedAuthor = false;
        ref.homepage = pkg.homepage || "";

        if (typeof pkg.author === "undefined") {
            ref.author = "N/A";

            return;
        }
        ref.author = pkg.author.name || pkg.author;

        const authors = [];
        ref.publishers = [];
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
 * @func depWalker
 * @param {Object} manifest manifest (package.json)
 * @param {Object} options options
 * @param {Boolean} [options.verbose=true] enable verbose mode
 * @param {Number} [options.maxDepth=2] max depth
 * @returns {Promise<null | Map<String, NodeSecure.Dependency>>}
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

    /** @type {Map<String, NodeSecure.Payload>} */
    const flattenedDeps = new Map();
    const promisesToWait = [];
    const exclude = new Map();

    for await (const currentDep of getRootDependencies(manifest, { maxDepth: options.maxDepth, exclude })) {
        const { name, version } = currentDep;
        const current = currentDep.flatten();

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

    // Handle excluded dependencies
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
