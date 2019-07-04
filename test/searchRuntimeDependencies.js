"use strict";

// Require Node.js Dependencies
const { readFile } = require("fs").promises;
const { join } = require("path");

// Require Internal Dependencies
const { searchRuntimeDependencies } = require("../src/ast");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/searchRuntimeDependencies");

test("should return runtime dependencies for one.js", async() => {
    const str = await readFile(join(FIXTURE_PATH, "one.js"), "utf-8");
    const files = searchRuntimeDependencies(str);
    expect(files).toStrictEqual(
        new Set(["http", "net", "fs", "assert", "timers", "./aFile.js", "path"])
    );
});
