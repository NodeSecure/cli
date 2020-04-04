"use strict";

// Require Node.js Dependencies
const { join } = require("path");

// Require Internal Dependencies
const { depWalker } = require("../src/depWalker");
const { from } = require("../");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/depWalker");

// JSON PAYLOADS
const is = require(join(FIXTURE_PATH, "slimio.is.json"));
const config = require(join(FIXTURE_PATH, "slimio.config.json"));

function cleanupPayload(payload) {
    for (const pkg of Object.values(payload)) {
        for (const versionName of pkg.versions) {
            pkg[versionName].composition.extensions.sort();
            delete pkg[versionName].size;
            delete pkg[versionName].composition.files;
        }
    }
}

test("execute depWalker on @slimio/is", async() => {
    const result = await depWalker(is, { verbose: false });
    const resultAsJSON = JSON.parse(JSON.stringify(result.dependencies, null, 2));
    cleanupPayload(resultAsJSON);

    expect(resultAsJSON).toMatchSnapshot();
});

test("execute depWalker on @slimio/config", async() => {
    const result = await depWalker(config, { verbose: false });
    const resultAsJSON = JSON.parse(JSON.stringify(result.dependencies, null, 2));

    const packages = Object.keys(resultAsJSON).sort();
    expect(packages).toEqual([
        "lodash.clonedeep",
        "zen-observable",
        "lodash.set",
        "lodash.get",
        "node-watch",
        "fast-deep-equal",
        "fast-json-stable-stringify",
        "json-schema-traverse",
        "punycode",
        "uri-js",
        "ajv",
        "@slimio/is",
        "@iarna/toml",
        "@slimio/config"
    ].sort());
});

test("fetch payload of pacote on the npm registry", async() => {
    const result = await from("pacote", { verbose: false, maxDepth: 10 });
    expect(Object.keys(result)).toMatchSnapshot();
});
