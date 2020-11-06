/**
 * @namespace Utils
 */

"use strict";

// Require Node.js Dependencies
const os = require("os");
const { extname, join, relative, basename } = require("path");
const { spawnSync } = require("child_process");
const {
    existsSync, readFileSync, writeFileSync,
    promises: { stat, opendir, readFile }
} = require("fs");

// SYMBOLS
const SYM_FILE = Symbol("symTypeFile");
const SYM_DIR = Symbol("symTypeDir");

// CONSTANTS
const EXCLUDE_DIRS = new Set(["node_modules", ".vscode", ".git"]);
const SENSITIVE_FILES = new Set([".npmrc", ".env"]);
const SENSITIVE_EXT = new Set([".key", ".pem"]);
const REGISTRY_DEFAULT_ADDR = "https://registry.npmjs.org/";

// VARS
let localNPMRegistry = null;

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

function cleanRange(version) {
    // TODO: how do we handle complicated range like pkg-name@1 || 2 or pkg-name@2.1.2 < 3
    const firstChar = version.charAt(0);
    if (firstChar === "^" || firstChar === "<" || firstChar === ">" || firstChar === "=" || firstChar === "~") {
        return version.slice(version.charAt(1) === "=" ? 2 : 1);
    }

    return version;
}

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

function loadNsecureCache(defaultPayload = Object.create(null)) {
    const filePath = join(os.tmpdir(), "nsecure-cache.json");

    if (existsSync(filePath)) {
        const buf = readFileSync(filePath);

        return JSON.parse(buf.toString());
    }

    const payload = Object.assign({}, JSON.parse(JSON.stringify(defaultPayload)), {
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

function isSensitiveFile(fileName) {
    if (SENSITIVE_FILES.has(basename(fileName))) {
        return true;
    }

    return SENSITIVE_EXT.has(extname(fileName));
}

function getPackageName(name) {
    const parts = name.split("/");

    return name.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return "0 B";
    }
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const id = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + " " + sizes[id];
}

function* deepReadPackageLock(dependencies) {
    for (const [depName, infos] of Object.entries(dependencies)) {
        if (!infos.dev) {
            yield [depName, infos];
            if (Reflect.has(infos, "dependencies")) {
                yield* deepReadPackageLock(infos.dependencies);
            }
        }
    }
}

async function* readPackageLock(filePath = join(process.cwd(), "package-lock.json")) {
    const buf = await readFile(filePath);
    const { dependencies = {} } = JSON.parse(buf.toString());

    yield* deepReadPackageLock(dependencies);
}

function cleanFlagsFromDependencies(dependencies) {
    for (const packageName in dependencies) {
        if (packageName) {
            const dependency = dependencies[packageName];
            if (dependency) {
                dependency.versions.forEach((version) => {
                    const flags = dependency[version].flags;
                    dependency[version].flags = cleanFlags(flags);
                });
            }
        }
    }
}

function cleanFlags(flags) {
    if (flags) {
        return Object.keys(flags).reduce((acc, curr) => {
            const flagValue = flags[curr];
            if (flagValue) {
                acc[curr] = flagValue;
            }

            return acc;
        }, {});
    }

    return {};
}

module.exports = Object.freeze({
    readPackageLock,
    formatBytes,
    getPackageName,
    isSensitiveFile,
    loadNsecureCache,
    writeNsecureCache,
    getFilesRecursive,
    getTarballComposition,
    mergeDependencies,
    cleanRange,
    taggedString,
    getRegistryURL,
    constants: Object.freeze({
        DEFAULT_REGISTRY_ADDR: getRegistryURL(),
        NPM_TOKEN: typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {},
        FILE: SYM_FILE,
        DIRECTORY: SYM_DIR,
        NPM_SCRIPTS: new Set(["preinstall", "postinstall", "preuninstall", "postuninstall"]),
        EXT_DEPS: new Set(["http", "https", "net", "http2", "dgram", "child_process"]),
        EXT_JS: new Set([".js", ".mjs", ".cjs"])
    }),
    cleanFlagsFromDependencies
});
