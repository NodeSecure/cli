"use strict";

// Require Node.js Dependencies
const { rmdirSync } = require("fs");
const os = require("os");
const { join } = require("path");

// Require Internal Dependencies
const {
    cleanRange, taggedString, writeNsecureCache, loadNsecureCache, getRegistryURL, isSensitiveFile
} = require("../src/utils");

test("should return cleaned SemVer range", () => {
    const r1 = cleanRange("0.1.0");
    const r2 = cleanRange("^1.0.0");
    const r3 = cleanRange(">=2.0.0");

    expect(r1).toStrictEqual("0.1.0");
    expect(r2).toStrictEqual("1.0.0");
    expect(r3).toStrictEqual("2.0.0");
});

test("taggedString", () => {
    const clojureHello = taggedString`Hello ${0}`;
    expect(clojureHello()).toStrictEqual("Hello ");
    expect(clojureHello("world")).toStrictEqual("Hello world");

    const clojureFoo = taggedString`Hello ${"word"}`;
    expect(clojureFoo({ word: "bar" })).toStrictEqual("Hello bar");
});

test("node-secure cache", () => {
    const filePath = join(os.tmpdir(), "nsecure-cache.json");
    rmdirSync(filePath, { recursive: true });

    const result = loadNsecureCache();
    expect(Reflect.has(result, "lastUpdated")).toBe(true);

    writeNsecureCache();

    const result2 = loadNsecureCache();
    expect(Reflect.has(result2, "lastUpdated")).toBe(true);
});

test("getRegistryURL should return the npm registry URL", async() => {
    const result = getRegistryURL();
    expect(result).toStrictEqual("https://registry.npmjs.org/");
    expect(getRegistryURL()).toStrictEqual("https://registry.npmjs.org/");
});

test("isSensitiveFile", () => {
    expect(isSensitiveFile(".npmrc")).toBe(true);
    expect(isSensitiveFile("lol.key")).toBe(true);
});
