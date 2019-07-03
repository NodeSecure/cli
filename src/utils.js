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

module.exports = { getTarballComposition };
