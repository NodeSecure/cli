/**
 * @namespace Utils
 */

"use strict";

// Require Node.js Dependencies
const { readdir, stat } = require("fs").promises;
const { extname, join, relative } = require("path");

// CONSTANTS
const EXCLUDE_DIRS = new Set(["node_modules", ".vscode", ".git"]);
const SYM_FILE = Symbol("FILE");
const SYM_DIR = Symbol("DIR");
const DEFAULT_TYPES = ["dependencies"];
const LICENSES = new Map([
    ["MIT", "MIT"],
    ["BSD", "BSD"],
    ["ISC ", "ISC"],
    ["Apache License", "Apache"],
    ["Mozilla", "Mozilla"],
    ["LGPL", "LGPL"],
    ["Affero", "GPL"],
    ["GPL", "GPL"],
    ["Eclipse", "Eclipse"],
    ["Artistic", "Artistic"],
    ["DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE", "WTF"]
]);

// TYPEDEF

/**
 * @typedef {Object} mergedDep
 * @property {String[]} dependencies
 * @property {Map<String, String>} customResolvers
 */

/**
 * @typedef {Object} tarballComposition
 * @property {Set<String>} ext all files extension
 * @property {Number} size size in bytes
 * @property {String[]} files complete list of files retrieved in the tarball
 */

/**
* @async
* @generator
* @func getFilesRecursive
* @memberof Utils#
* @param {!String} dir root directory
* @returns {AsyncIterableIterator<String>}
*/
async function* getFilesRecursive(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
        if (EXCLUDE_DIRS.has(dirent.name)) {
            continue;
        }

        if (dirent.isFile()) {
            yield [SYM_FILE, join(dir, dirent.name)];
        }
        else if (dirent.isDirectory()) {
            const fullPath = join(dir, dirent.name);
            yield [SYM_DIR, fullPath];
            yield* getFilesRecursive(fullPath);
        }
    }
}

/**
 * @async
 * @func getTarballComposition
 * @desc Get the size and the file(s) and directorie(s) composition of a given extracted npm tarball
 * @memberof Utils#
 * @param {!String} tarballDir tarball dir
 * @returns {Promise<tarballComposition>}
 */
async function getTarballComposition(tarballDir) {
    const ext = new Set();
    const files = [];
    const dirs = [];
    let size = (await stat(tarballDir)).size;

    for await (const [kind, file] of getFilesRecursive(tarballDir)) {
        switch (kind) {
            case SYM_FILE:
                ext.add(extname(file));
                files.push(file);
                break;
            case SYM_DIR:
                dirs.push(file);
                break;
        }
    }

    try {
        const sizeAll = await Promise.all([
            ...files.map((file) => stat(file)),
            ...dirs.map((file) => stat(file))
        ]);
        size += sizeAll.reduce((prev, curr) => prev + curr.size, 0);
    }
    catch (err) {
        // ignore
    }

    return { ext, size, files: files.map((path) => relative(tarballDir, path)) };
}

/**
 * @func mergeDependencies
 * @desc Merge all kinds (dep, devDep etc..) of dependencies section of npm Manifest (package.json)
 * @memberof Utils#
 * @param {!Object} manifest manifest
 * @param {String[]} [types] dependencies types to merge
 * @returns {mergedDep}
 */
function mergeDependencies(manifest, types = DEFAULT_TYPES) {
    const ret = new Set();
    const customResolvers = new Map();

    for (const fieldName of types) {
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
 * @func getLicenseFromString
 * @memberof Utils#
 * @param {!String} str license file content
 * @returns {String}
 */
function getLicenseFromString(str) {
    for (const [name, licenseName] of LICENSES.entries()) {
        if (str.indexOf(name) > -1) {
            return licenseName;
        }
    }

    return "Unknown License";
}

module.exports = Object.freeze({
    getTarballComposition,
    mergeDependencies,
    getLicenseFromString
});
