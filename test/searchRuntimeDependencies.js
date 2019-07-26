"use strict";

// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Internal Dependencies
const { searchRuntimeDependencies } = require("../src/ast");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/searchRuntimeDependencies");

// Payloads
const one = readFileSync(join(FIXTURE_PATH, "one.js"), "utf-8");
const two = readFileSync(join(FIXTURE_PATH, "two.js"), "utf-8");
const three = readFileSync(join(FIXTURE_PATH, "three.js"), "utf-8");

test("should return runtime dependencies for one.js", () => {
    const { dependencies, isSuspect } = searchRuntimeDependencies(one);

    expect(isSuspect).toStrictEqual(false);
    expect(dependencies).toStrictEqual(
        new Set(["http", "net", "fs", "assert", "timers", "./aFile.js", "path"])
    );
});

test("should return runtime dependencies for two.js", () => {
    const { dependencies, isSuspect } = searchRuntimeDependencies(two);

    expect(isSuspect).toStrictEqual(false);
    expect(dependencies).toStrictEqual(new Set(["http", "events"]));
});

test("should return isSuspect = true for three.js", () => {
    const { dependencies, isSuspect } = searchRuntimeDependencies(three);

    expect(isSuspect).toStrictEqual(true);
    expect(dependencies).toStrictEqual(new Set());
});
