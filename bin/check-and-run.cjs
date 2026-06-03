#!/usr/bin/env node

"use strict";

const { createRequire } = require("node:module");
const localRequire = createRequire(__filename);

const manifest = localRequire("../package.json");
const semver = localRequire("semver");

const currentVersion = process.versions.node;
const requiredRange = manifest.engines.node;

if (!semver.satisfies(currentVersion, requiredRange)) {
  console.error(
    `\n  @nodesecure/cli requires Node.js ${requiredRange}.` +
    `\n  Current version: v${currentVersion}\n`
  );
  process.exit(1);
}

if (require.main === module) {
  import("./index.js");
}
