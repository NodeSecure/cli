"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { promisify } = require("util");

// Require Third-party Dependencies
const getSize = require("get-folder-size");

// Require Internal Dependencies
const { getTarballComposition } = require("../src/utils");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/getTarballComposition");

// Vars
const directorySize = promisify(getSize);

test("should return the composition of a directory", async() => {
    const composition = await getTarballComposition(FIXTURE_PATH);
    const size = await directorySize(FIXTURE_PATH);

    expect(composition).toMatchObject({
        ext: new Set(["", ".js", ".json", ".txt"]),
        size
    });
    expect(composition.files).toHaveLength(4);
    expect(composition.files.sort()[0]).toMatch(/one(\/|\\)README/);
});
