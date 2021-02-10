"use strict";

const { buildVersionChecker } = require("../src/checkVersion");

test("isAnalysisVersionValid should return true when the version satisfies the range", () => {
    const isPackageValid = buildVersionChecker(">=1.0.0");

    expect(isPackageValid("1.0.0")).toBe(true);
    expect(isPackageValid("1.0.1")).toBe(true);
    expect(isPackageValid("2.0.1-0")).toBe(true);
    expect(isPackageValid("3.6.7.9.3-alpha")).toBe(true);
});

test("isAnalysisVersionValid should return false when the version doesn't satisfies the range", () => {
    const isPackageValid = buildVersionChecker("<=1.0.0");

    expect(isPackageValid("1.0.1")).toBe(false);
    expect(isPackageValid("2.0.1")).toBe(false);
    expect(isPackageValid("3.0.1-0")).toBe(false);
    expect(isPackageValid("3.6.7.9.3-alpha")).toBe(false);
});
