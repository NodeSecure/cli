"use strict";

// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Internal Dependencies
const { searchRuntimeDependencies } = require("../src/ast");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/searchRuntimeDependencies");

// Payloads
const trycatch = readFileSync(join(FIXTURE_PATH, "try-catch.js"), "utf-8");
const esm = readFileSync(join(FIXTURE_PATH, "esm.js"), "utf-8");

test("should return runtime dependencies for one.js", () => {
    const { dependencies, warnings } = searchRuntimeDependencies(`
    const http = require("http");
    const net = require("net");
    const fs = require("fs").promises;

    require("assert").strictEqual;
    require("timers");
    require("./aFile.js");

    const myVar = "path";
    require(myVar);`, { module: false });

    expect(warnings.length).toStrictEqual(0);
    expect([...dependencies]).toStrictEqual(
        ["http", "net", "fs", "assert", "timers", "./aFile.js", "path"]
    );
});

test("should return runtime dependencies for two.js", () => {
    const { dependencies, warnings } = searchRuntimeDependencies(`const myVar = "ht";
    require(myVar + "tp");
    require("eve" + "nt" + "s");
    `);

    expect(warnings.length).toStrictEqual(0);
    expect([...dependencies]).toStrictEqual(["http", "events"]);
});

test("should return isSuspect = true for three.js", () => {
    const { dependencies, warnings, isOneLineRequire } = searchRuntimeDependencies(`
        function evil() {
            return "http";
        }
        require(evil());
        require(evil() + "s");
    `);

    expect(warnings.length).toStrictEqual(2);
    expect(isOneLineRequire).toStrictEqual(false);
    expect([...dependencies]).toStrictEqual([]);
});

test("should return runtime dependencies for five.js", () => {
    const { dependencies, warnings } = searchRuntimeDependencies(`
    const foo = "bar";

    require.resolve("http");
    require(["net", "-", "tcp"]);
    require([foo, "world"]);
    require([104,101,108,108,111]);

    process["mainModule"]["util"];`);

    expect(warnings.length).toStrictEqual(0);
    expect([...dependencies]).toStrictEqual(["http", "net-tcp", "barworld", "hello", "util"]);
});

test("should support runtime analysis of ESM and return http", () => {
    const { dependencies, warnings } = searchRuntimeDependencies(esm, { module: true });

    expect(warnings.length).toStrictEqual(0);
    expect([...dependencies]).toStrictEqual(["http"]);
});

test("should detect that http is under a TryStatement", () => {
    const { dependencies: deps } = searchRuntimeDependencies(trycatch);

    expect(Reflect.has(deps.dependencies, "http")).toStrictEqual(true);
    expect(deps.dependencies.http.inTry).toStrictEqual(true);
});

test("should return isOneLineRequire true for a one liner CJS export", () => {
    const { dependencies, isOneLineRequire } = searchRuntimeDependencies("module.exports = require('foo');");

    expect(isOneLineRequire).toStrictEqual(true);
    expect([...dependencies]).toStrictEqual(["foo"]);
});
