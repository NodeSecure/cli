// Require Third-party Dependencies
const pacote = require("pacote");
const { red } = require("kleur");

// CONSTANTS
// const TYPES = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const TYPES = ["dependencies"];
const MAX_DEPTH = 2;

/**
 * @func mergeDependencies
 * @desc Merge all kinds (dep, devDep etc..) of dependencies section of npm Manifest (package.json)
 * @param {!Object} manifest manifest
 * @returns {String[]}
 */
function mergeDependencies(manifest) {
    const ret = new Set();
    for (const fieldName of TYPES) {
        const dep = manifest[fieldName] || Object.create(null);
        for (const [name, version] of Object.entries(dep)) {
            // TODO: still have to detect local file & git+
            // Version can be file: or github: (etc...)
            if (/^[a-zA-Z]+:/.test(version)) {
                // TODO: flag these dependencies ?
                continue;
            }

            // Do we have to handle by version?
            ret.add(`${name}@${version}`);
        }
    }

    return [...ret];
}

/**
 * @async
 * @generator
 * @func searchDeepDependencies
 * @param {!String} packageName packageName (and version)
 * @param {Set<String>} exclude packages that are excluded (avoid infinite recursion).
 * @param {Number} [currDepth=0] current depth
 * @returns {Promise<any>}
 */
async function searchDeepDependencies(packageName, exclude = new Set(), currDepth = 0) {
    const { name, version, ...pkg } = await pacote.manifest(packageName);

    const dependencies = mergeDependencies(pkg);
    const ret = [{ name, version }];

    if (dependencies.length === 0 || currDepth === MAX_DEPTH) {
        return ret;
    }

    const _p = [];
    for (const depName of dependencies) {
        if (exclude.has(depName)) {
            continue;
        }

        exclude.add(depName);
        _p.push(searchDeepDependencies(depName, exclude, currDepth + 1)
            .catch(() => console.error(red().bold(`failed on ${depName}`))));
    }
    const subDependencies = await Promise.all(_p);
    ret.push(...subDependencies.flat());

    return ret;
}

async function depWalker(manifest) {
    pacote.clearMemoized();
    const dependencies = mergeDependencies(manifest);
    if (dependencies.length === 0) {
        return Object.create(null);
    }

    // TODO: get tree of dependencies
    // TODO: get tarballs

    const exclude = new Set();
    const result = await Promise.all(
        dependencies.map((name) => searchDeepDependencies(name, exclude))
    );
    const allDependencies = result.flat(MAX_DEPTH);
    // console.log(JSON.stringify(allDependencies, null, 4));
    console.log(allDependencies.length);

    return {};
}

module.exports = { depWalker };
