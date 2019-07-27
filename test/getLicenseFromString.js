"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const { readFileSync } = require("fs");

// Require Internal Dependencies
const { getLicenseFromString } = require("../src/utils");

// CONSTANTS
const FIXTURE_PATH = join(__dirname, "fixtures/getLicenseFromString");

// Payloads
const MIT = readFileSync(join(FIXTURE_PATH, "MIT.md"), "utf-8");

test("should return 'MIT' for getLicenseFromString of MIT file", () => {
    const result = getLicenseFromString(MIT);
    expect(result).toStrictEqual("MIT");
});

test("should return 'Unknown License' for getLicenseFromString from random string", () => {
    const result = getLicenseFromString("hello world!");
    expect(result).toStrictEqual("Unknown License");
});
