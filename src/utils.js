/**
 * @namespace Utils
 */

"use strict";

// Require Node.js Dependencies
const os = require("os");
const {
    existsSync, readFileSync, writeFileSync,
    promises: { stat, opendir }
} = require("fs");
const { extname, join, relative } = require("path");
const { spawnSync } = require("child_process");

// Require Third-party Dependencies
const cloneDeep = require("lodash.clonedeep");

// SYMBOLS
const SYM_FILE = Symbol("symTypeFile");
const SYM_DIR = Symbol("symTypeDir");

// CONSTANTS
const EXCLUDE_DIRS = new Set(["node_modules", ".vscode", ".git"]);
const REGISTRY_DEFAULT_ADDR = "https://registry.npmjs.org/";

// VARS
let localNPMRegistry = null;

// TYPEDEF

/**
 * @typedef {object} mergedDep
 * @property {Map<string, string>} dependencies
 * @property {Map<string, string>} customResolvers
 */

/**
 * @typedef {object} tarballComposition
 * @property {Set<string>} ext all files extension
 * @property {number} size size in bytes
 * @property {string[]} files complete list of files retrieved in the tarball
 */

/**
 * @async
 * @generator
 * @function getFilesRecursive
 * @memberof Utils#
 * @param {!string} dir root directory
 * @returns {AsyncIterableIterator<string>}
 */
async function* getFilesRecursive(dir) {
    const dirents = await opendir(dir);

    for await (const dirent of dirents) {
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
 * @function getTarballComposition
 * @description Get the size and the file(s) and directorie(s) composition of a given extracted npm tarball
 * @memberof Utils#
 * @param {!string} tarballDir tarball dir
 * @returns {Promise<tarballComposition>}
 */
async function getTarballComposition(tarballDir) {
    const ext = new Set();
    const files = [];
    const dirs = [];
    let { size } = await stat(tarballDir);

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

    return {
        ext,
        size,
        files: files.map((path) => relative(tarballDir, path))
    };
}

/**
 * @function mergeDependencies
 * @description Merge all kinds (dep, devDep etc..) of dependencies section of npm Manifest (package.json)
 * @memberof Utils#
 * @param {!object} manifest manifest
 * @param {string[]} [types] dependencies types to merge
 * @returns {mergedDep}
 */
function mergeDependencies(manifest, types = ["dependencies"]) {
    const dependencies = new Map();
    const customResolvers = new Map();

    for (const fieldName of types) {
        if (!Reflect.has(manifest, fieldName)) {
            continue;
        }
        const dep = manifest[fieldName];

        for (const [name, version] of Object.entries(dep)) {
            // Version can be file:, github:, git+, ./...
            if (/^([a-zA-Z]+:|git\+|\.\\)/.test(version)) {
                customResolvers.set(name, version);
                continue;
            }

            dependencies.set(name, version);
        }
    }

    return { dependencies, customResolvers };
}

/**
 * @function cleanRange
 * @description Clean up range (as possible).
 * @memberof Utils#
 * @param {!string} version version
 * @returns {string}
 *
 * @example
 * const assert = require("assert").strict;
 *
 * const ret = cleanRange("^1.0.0");
 * assert.equal(ret, "1.0.0");
 *
 * @see https://github.com/npm/node-semver#ranges
 */
function cleanRange(version) {
    // TODO: how do we handle complicated range like pkg-name@1 || 2 or pkg-name@2.1.2 < 3
    const firstChar = version.charAt(0);
    if (firstChar === "^" || firstChar === "<" || firstChar === ">" || firstChar === "=" || firstChar === "~") {
        return version.slice(version.charAt(1) === "=" ? 2 : 1);
    }

    return version;
}

/**
 * @function getRegistryURL
 * @description retrieve the local npm registry URL (or return the default registry url if there is nothing in local).
 * @memberof Utils#
 * @param {boolean} [force=false] force spawn execution
 * @returns {string}
 */
function getRegistryURL(force = false) {
    if (localNPMRegistry !== null && !force) {
        return localNPMRegistry;
    }

    try {
        const stdout = spawnSync(
            `npm${process.platform === "win32" ? ".cmd" : ""}`, ["config", "get", "registry"]).stdout.toString();
        localNPMRegistry = stdout.trim() === "" ? REGISTRY_DEFAULT_ADDR : stdout.trim();

        return localNPMRegistry;
    }
    catch (error) {
        /* istanbul ignore next */
        return REGISTRY_DEFAULT_ADDR;
    }
}

function loadNsecureCache(defaultPayload = {}) {
    const filePath = join(os.tmpdir(), "nsecure-cache.json");

    if (existsSync(filePath)) {
        const buf = readFileSync(filePath);

        return JSON.parse(buf.toString());
    }

    const payload = Object.assign({}, cloneDeep(defaultPayload), {
        lastUpdated: Date.now() - (3600000 * 48)
    });
    writeFileSync(filePath, JSON.stringify(payload));

    return payload;
}

function writeNsecureCache() {
    const filePath = join(os.tmpdir(), "nsecure-cache.json");

    const payload = {
        lastUpdated: Date.now()
    };
    writeFileSync(filePath, JSON.stringify(payload));
}

function taggedString(chaines, ...cles) {
    return function cur(...valeurs) {
        const dict = valeurs[valeurs.length - 1] || {};
        const resultat = [chaines[0]];
        cles.forEach((cle, index) => {
            resultat.push(
                typeof cle === "number" ? valeurs[cle] : dict[cle],
                chaines[index + 1]
            );
        });

        return resultat.join("");
    };
}

module.exports = Object.freeze({
    loadNsecureCache,
    writeNsecureCache,
    getFilesRecursive,
    getTarballComposition,
    mergeDependencies,
    cleanRange,
    taggedString,
    getRegistryURL,
    constants: Object.freeze({
        FILE: SYM_FILE,
        DIRECTORY: SYM_DIR
    })
});
