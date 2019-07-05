"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const { mkdir, readFile } = require("fs").promises;
const { performance } = require("perf_hooks");
const repl = require("repl");

// Require Third-party Dependencies
const pacote = require("pacote");
const { red, white, yellow, cyan, green } = require("kleur");
const premove = require("premove");
const Lock = require("@slimio/lock");
const ora = require("ora");
const isMinified = require("is-minified-code");
const Registry = require("@slimio/npm-registry");

// Require Internal Dependencies
const { getTarballComposition, mergeDependencies, getLicenseFromString } = require("./utils");
const { searchRuntimeDependencies } = require("./ast");

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
 * @param {Object=} [options={}] options
 * @param {Set<String>} [options.exclude] packages that are excluded (avoid infinite recursion).
 * @param {Number} [options.currDepth=0] current depth
 * @param {String} [options.parent] parent dependency
 * @param {Number} [options.maxDepth=2] max depth
 * @returns {Promise<NodeSecure.Dependency[]>}
 */
async function searchDeepDependencies(packageName, options = {}) {
    const { exclude = new Set(), currDepth = 0, parent = null, maxDepth = 2 } = options;
    const { name, version, deprecated, ...pkg } = await pacote.manifest(packageName);

    const { dependencies, customResolvers } = mergeDependencies(pkg);
    if (dependencies.length > 0 && parent !== null) {
        parent.flags.hasIndirectDependencies = true;
    }

    const current = {
        name, version,
        parent: parent === null ? null : { name: parent.name, version: parent.version },
        flags: {
            hasManifest: true,
            isDeprecated: deprecated === true,
            hasSuspectImport: false,
            hasLicense: false,
            hasIndirectDependencies: false,
            hasMinifiedCode: false,
            hasCustomResolver: customResolvers.size > 0,
            hasDependencies: dependencies.length > 0
        }
    };

    const ret = [current];
    if (dependencies.length === 0 || currDepth === maxDepth) {
        return ret;
    }

    const _p = [];
    const opt = { exclude, currDepth: currDepth + 1, parent: current, maxDepth };
    for (const depName of dependencies) {
        if (exclude.has(depName)) {
            continue;
        }

        exclude.add(depName);
        _p.push(searchDeepDependencies(depName, opt)
            .catch(() => console.error(red().bold(`failed to fetch '${depName}'`))));
    }
    const subDependencies = await Promise.all(_p);
    ret.push(...subDependencies.flat(maxDepth));

    return ret;
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

        try {
            const packageStr = await readFile(join(dest, "package.json"), "utf-8");
            const { description = "", author = {} } = JSON.parse(packageStr);
            ref.description = description;
            ref.author = author;
        }
        catch (err) {
            ref.flags.hasManifest = false;
            ref.description = "";
            ref.author = "N/A";
        }

        const { ext, files, size } = await getTarballComposition(dest);
        ref.size = size;
        ref.composition = { extensions: [...ext], files };

        const hasLicense = files.find((value) => value.toLowerCase().includes("license"));
        if (typeof hasLicense === "undefined") {
            ref.flags.hasLicense = false;
        }
        else {
            ref.flags.hasLicense = true;
            const str = await readFile(join(dest, hasLicense), "utf-8");
            ref.license = getLicenseFromString(str);
        }

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
 * @param {Boolean} [options.verbose=true] enable verbose mode
 * @param {Number} [options.maxDepth=2] max depth
 * @returns {Promise<null | NodeSecure.Dependency[]>}
 */
async function getRootDependencies(manifest, options) {
    const { verbose = true, maxDepth = 2 } = options;

    let spinner;
    if (verbose) {
        spinner = ora({ spinner: "dots" }).start(white().bold("Fetch all dependencies..."));
    }
    try {
        const start = performance.now();
        const { dependencies } = mergeDependencies(manifest);
        if (dependencies.length === 0) {
            if (verbose) {
                spinner.succeed(yellow().bold("No dependencies to fetch..."));
            }

            return null;
        }
        const exclude = new Set();

        const result = (await Promise.all(
            dependencies.map((name) => searchDeepDependencies(name, { exclude, maxDepth }))
        )).flat();
        const execTime = cyan().bold((performance.now() - start).toFixed(2));
        if (verbose) {
            spinner.succeed(white().bold(`Successfully fetched ${green().bold(result.length)} dependencies in ${execTime} ms`));
        }

        return result;
    }
    catch (err) {
        if (verbose) {
            spinner.fail(red().bold(err.message));
        }

        return null;
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
        console.error(err);
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
    pacote.clearMemoized();

    const allDependencies = await getRootDependencies(manifest, options);
    if (allDependencies === null) {
        return null;
    }

    // Create TMP directory
    await mkdir(TMP, { recursive: true });

    /** @type {Map<String, NodeSecure.Payload>} */
    const flattenedDeps = new Map();
    const promisesToWait = [];

    for (const { name, version, parent, flags } of allDependencies) {
        const current = {
            [version]: {
                usedBy: parent === null ? {} : { [parent.name]: parent.version },
                flags
            }
        };
        promisesToWait.push(
            searchPackageAuthors(name, current),
            processPackageTarball(name, version, current[version])
        );

        if (flattenedDeps.has(name)) {
            const dep = flattenedDeps.get(name);
            const hasIndirectDependencies = Reflect.has(dep, version) ? dep[version].flags.hasIndirectDependencies : false;
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
    const { verbose = true } = options;
    let spinner;
    if (verbose) {
        spinner = ora({ spinner: "dots" }).start(white().bold("Fetching all packages stats ..."));
    }
    try {
        const start = performance.now();
        await Promise.all(promisesToWait);
        const execTime = cyan().bold((performance.now() - start).toFixed(2));
        if (verbose) {
            spinner.succeed(white().bold(`Successfully fetched and processed all stats in ${execTime} ms`));
        }
    }
    catch (err) {
        if (verbose) {
            spinner.fail(red().bold(err.message));
        }

        return null;
    }

    // TODO: search for vulnerabilities?

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
