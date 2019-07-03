/**
 * @namespace Utils
 */

// Require Node.js Dependencies
const { readdir, stat } = require("fs").promises;
const { extname, join } = require("path");

// CONSTANTS
const EXCLUDE_DIRS = new Set(["node_modules", ".vscode", ".git"]);

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
            yield join(dir, dirent.name);
        }
        else if (dirent.isDirectory()) {
            yield* getFilesRecursive(join(dir, dirent.name));
        }
    }
}

/**
 * @typedef {Object} tarballComposition
 * @property {Set<String>} ext all files extension
 * @property {Number} size size in bytes
 * @property {String[]} files complete list of files retrieved in the tarball
 */

/**
 * @async
 * @func getTarballComposition
 * @memberof Utils#
 * @param {!String} tarballDir tarball dir
 * @returns {Promise<tarballComposition>}
 */
async function getTarballComposition(tarballDir) {
    const ext = new Set();
    const files = [];

    for await (const file of getFilesRecursive(tarballDir)) {
        ext.add(extname(file));
        files.push(file);
    }

    /** @type {Number} */
    let size = 0;
    try {
        const sizeAll = await Promise.all(files.map((file) => stat(file)));
        size = sizeAll.reduce((prev, curr) => prev + curr.size, 0);
    }
    catch (err) {
        // ignore
    }

    return { ext, size, files };
}

module.exports = { getTarballComposition };
