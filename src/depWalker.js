"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { mkdir, readFile } = require("fs").promises;
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const pacote = require("pacote");
const { red, white, yellow, cyan, green, grey } = require("kleur");
const premove = require("premove");
const Lock = require("@slimio/lock");
const ora = require("ora");

// Require Internal Dependencies
const { getTarballComposition } = require("./utils");

// CONSTANTS
// const TYPES = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const TYPES = ["dependencies"];
const MAX_DEPTH = 2;
const TMP = join(__dirname, "..", "tmp");

// Vars
const tarballLocker = new Lock({ max: 25 });

/**
 * @typedef {Object} mergedDep
 * @property {String[]} dependencies
 * @property {Map<String, String>} customResolvers
 */

/**
 * @func mergeDependencies
 * @desc Merge all kinds (dep, devDep etc..) of dependencies section of npm Manifest (package.json)
 * @param {!Object} manifest manifest
 * @returns {mergedDep}
 */
function mergeDependencies(manifest) {
    const ret = new Set();
    const customResolvers = new Map();

    for (const fieldName of TYPES) {
        const dep = manifest[fieldName] || Object.create(null);
        for (const [name, version] of Object.entries(dep)) {
            // Version can be file:, github:, git+, ./...
            if (/^([a-zA-Z]+:|git\+|\.\\)/.test(version)) {
                customResolvers.set(name, version);
                continue;
            }

            // Do we have to handle by version?
            ret.add(`${name}@${version}`);
        }
    }

    return { dependencies: [...ret], customResolvers };
}

/**
 * @async
 * @generator
 * @func searchDeepDependencies
 * @param {!String} packageName packageName (and version)
 * @param {Object=} [options={}] options
 * @param {Set<String>} [options.exclude] packages that are excluded (avoid infinite recursion).
 * @param {Number} [options.currDepth=0] current depth
 * @param {String} [options.parent] parent dependency
 * @returns {Promise<NodeSecure.Dependency[]>}
 */
async function searchDeepDependencies(packageName, options = {}) {
    const { exclude = new Set(), currDepth = 0, parent = null } = options;
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
            hasLicense: false,
            hasIndirectDependencies: false,
            hasCustomResolver: customResolvers.size > 0,
            hasDependencies: dependencies.length > 0
        }
    };

    const ret = [current];
    if (dependencies.length === 0 || currDepth === MAX_DEPTH) {
        return ret;
    }

    const _p = [];
    const opt = { exclude, currDepth: currDepth + 1, parent: current };
    for (const depName of dependencies) {
        if (exclude.has(depName)) {
            continue;
        }

        exclude.add(depName);
        _p.push(searchDeepDependencies(depName, opt)
            .catch(() => console.error(red().bold(`failed to fetch '${depName}'`))));
    }
    const subDependencies = await Promise.all(_p);
    ret.push(...subDependencies.flat(MAX_DEPTH));

    return ret;
}

/**
 * @async
 * @func extractTarball
 * @param {!String} name package name
 * @param {!String} version package version
 * @param {*} ref version ref
 * @returns {Promise<void>}
 */
async function extractTarball(name, version, ref) {
    const fullName = `${name}@${version}`;
    const dest = join(TMP, fullName);
    const free = await tarballLocker.lock();

    try {
        await pacote.extract(fullName, dest);

        // TODO: (in a worker thread with ework)
        // - dependencies executed at runtime
        // - uglified/minified code (is-minified-code lib)

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
        if (typeof hasLicense !== "undefined") {
            ref.flags.hasLicense = true;
            // TODO: detect the kind of the license
        }

        // wait for to the next iteration (avoid lock).
        await new Promise((resolve) => setImmediate(resolve));
    }
    catch (err) {
        console.log(err);
        // console.log(red().bold(`Failed to extract tarball for package ${fullName}`));
    }
    finally {
        free();
    }
}

/**
 * @async
 * @func getRootDependencies
 * @param {any} manifest package manifest
 * @returns {Promise<null | NodeSecure.Dependency[]>}
 */
async function getRootDependencies(manifest) {
    const spinner = ora({ spinner: "dots" }).start(white().bold("Fetch all dependencies..."));
    try {
        const start = performance.now();
        const { dependencies } = mergeDependencies(manifest);
        if (dependencies.length === 0) {
            spinner.succeed(yellow().bold("No dependencies to fetch..."));

            return null;
        }
        const exclude = new Set();

        const result = (await Promise.all(
            dependencies.map((name) => searchDeepDependencies(name, { exclude }))
        )).flat();
        const execTime = cyan().bold((performance.now() - start).toFixed(2));
        spinner.succeed(white().bold(`Successfully fetched ${green().bold(result.length)} dependencies in ${execTime} ms`));

        return result;
    }
    catch (err) {
        spinner.fail(red().bold(err.message));

        return null;
    }
}

/**
 * @async
 * @func depWalker
 * @param {Object} manifest manifest (package.json)
 * @returns {Promise<null | Map<String, NodeSecure.Dependency>>}
 */
async function depWalker(manifest) {
    pacote.clearMemoized();

    const allDependencies = await getRootDependencies(manifest);
    if (allDependencies === null) {
        return null;
    }

    // Create TMP directory
    try {
        await mkdir(TMP);
        console.log(grey().bold(`\n > ${yellow().bold(TMP)} directory created!\n`));
    }
    catch (err) {
        if (err.code !== "EEXIST") {
            throw err;
        }
    }

    /** @type {Map<String, NodeSecure.Payload>} */
    const flattenedDeps = new Map();
    const tarballsPromises = [];
    for (const { name, version, parent, flags } of allDependencies) {
        const current = {
            [version]: {
                usedBy: parent === null ? {} : { [parent.name]: parent.version },
                flags
            }
        };
        tarballsPromises.push(extractTarball(name, version, current[version]));

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
    const spinner = ora({ spinner: "dots" }).start(white().bold("Fetching all packages tarballs ..."));
    try {
        const start = performance.now();
        await Promise.all(tarballsPromises);
        const execTime = cyan().bold((performance.now() - start).toFixed(2));
        spinner.succeed(white().bold(`Successfully fetched and processed all tarballs in ${execTime} ms`));
    }
    catch (err) {
        spinner.fail(red().bold(err.message));

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
