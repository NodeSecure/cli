"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { readFile, access } = require("fs").promises;

// Require Third-party Dependencies
const pacote = require("pacote");

// Require Internal Dependencies
const { depWalker } = require("./src/depWalker");

async function cwd(cwd = process.cwd(), options) {
    const packagePath = join(cwd, "package.json");

    await access(packagePath);
    const str = await readFile(packagePath, "utf-8");
    const manifest = JSON.parse(str);

    return depWalker(manifest, options);
}

async function from(packageName, options) {
    const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};
    const manifest = await pacote.manifest(packageName, token);

    return depWalker(manifest, options);
}

module.exports = {
    cwd, from
};
