"use strict";

// Require Node.js Dependencies
const { join } = require("path");

// Require Internal Dependencies
const { getTarballComposition } = require("../src/utils");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/getTarballComposition");

test("should return the composition of a directory", async() => {
    const composition = await getTarballComposition(FIXTURE_PATH);
    expect(composition).toMatchObject({
        ext: new Set(["", ".js", ".json", ".txt"]),
        size: 52
    });
    expect(composition.files).toHaveLength(4);
    expect(composition.files[0]).toMatch(/one(\/|\\)README/);
});
