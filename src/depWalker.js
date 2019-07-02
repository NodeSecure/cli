// Require Third-party Dependencies
const pacote = require("pacote");
const { red } = require("kleur");

// CONSTANTS
// const TYPES = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const TYPES = ["dependencies"];
const MAX_DEPTH = 2;

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
 * @returns {Promise<any>}
 */
async function searchDeepDependencies(packageName, options = {}) {
    const { exclude = new Set(), currDepth = 0, parent = null } = options;
    const { name, version, ...pkg } = await pacote.manifest(packageName);

    const { dependencies, customResolvers } = mergeDependencies(pkg);
    if (dependencies.length > 0 && parent !== null) {
        parent.flags.hasIndirectDependencies = true;
    }

    const current = {
        name, version,
        parent: parent === null ? null : { name: parent.name, version: parent.version },
        flags: {
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
    ret.push(...subDependencies.flat());

    return ret;
}

async function depWalker(manifest) {
    pacote.clearMemoized();
    const { dependencies } = mergeDependencies(manifest);
    if (dependencies.length === 0) {
        return Object.create(null);
    }

    const exclude = new Set();
    const result = await Promise.all(
        dependencies.map((name) => searchDeepDependencies(name, { exclude }))
    );
    const allDependencies = result.flat(MAX_DEPTH);

    // TODO: link and flag data for direct/indirect
    console.log(allDependencies);
    console.log(`Number of dependencies: ${allDependencies.length}`);

    // TODO: extract all tarball

    return {};
}

module.exports = { depWalker };
