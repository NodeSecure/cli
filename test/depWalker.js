"use strict";

// Require Node.js Dependencies
const { join } = require("path");

// Require Internal Dependencies
const { depWalker } = require("../src/depWalker");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/depWalker");

// JSON PAYLOADS
const is = require(join(FIXTURE_PATH, "slimio.is.json"));

test("should return null for depWalker of @slimio/is", async() => {
    const result = await depWalker(is, { verbose: false });
    const resultAsJSON = JSON.parse(JSON.stringify(Object.fromEntries(result), null, 2));

    // TODO: how can we test the complete payload without breaking depending the OS ?
    resultAsJSON["@slimio/is"]["1.5.1"].composition.extensions.sort();
    delete resultAsJSON["@slimio/is"]["1.5.1"].size;
    delete resultAsJSON["@slimio/is"]["1.5.1"].composition.files;

    expect(resultAsJSON).toMatchSnapshot();
});
