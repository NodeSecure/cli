"use strict";

// Require Node.js Dependencies
const { join } = require("path");

// Require Internal Dependencies
const { searchRuntimeDependencies } = require("../src/ast");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/searchRuntimeDependencies");

test("should return runtime dependencies for one.js", async() => {
    const files = await searchRuntimeDependencies(join(FIXTURE_PATH, "one.js"));
    expect(files).toMatchObject(
        new Set(["http", "net", "fs", "assert", "timers", "./aFile.js", "path"])
    );
});
