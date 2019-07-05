"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { readFile, access } = require("fs").promises;

// Require Internal Dependencies
const { depWalker } = require("./src/depWalker");

module.exports = async function nodesecure(cwd = process.cwd(), verbose = false) {
    const packagePath = join(cwd, "package.json");

    await access(packagePath);
    const str = await readFile(packagePath, "utf-8");
    const manifest = JSON.parse(str);

    return depWalker(manifest, { verbose });
};
