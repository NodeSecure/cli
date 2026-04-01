// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Import Internal Dependencies
import {
  computeMatches,
  getFlagCounts,
  getFilterValueCounts,
  getHelperValues
} from "../../public/components/command-palette/filters.js";

const kLinker = new Map([
  [0, {
    name: "express",
    version: "4.18.2",
    flags: ["hasWarnings", "hasIndirectDependencies"],
    uniqueLicenseIds: ["MIT"],
    composition: { extensions: [".js", ".ts"], required_nodejs: ["fs", "path"] },
    author: { name: "TJ Holowaychuk" },
    size: 102_400
  }],
  [1, {
    name: "lodash",
    version: "0.5.0",
    flags: ["hasWarnings", "hasMinifiedCode"],
    uniqueLicenseIds: ["MIT", "ISC"],
    composition: { extensions: [".js", ""], required_nodejs: ["path"] },
    author: "John-David Dalton",
    size: 5_000
  }],
  [2, {
    name: "semver",
    version: "7.5.4",
    flags: [],
    uniqueLicenseIds: ["ISC"],
    composition: { extensions: [".js"], required_nodejs: [] },
    author: null,
    size: 20_000
  }]
]);

describe("computeMatches", () => {
  describe("filter: package", () => {
    it("should match packages by regex against name", () => {
      const result = computeMatches(kLinker, "package", "express");

      assert.deepEqual(result, new Set(["0"]));
    });

    it("should match multiple packages with a partial regex", () => {
      const result = computeMatches(kLinker, "package", "e");

      assert.deepEqual(result, new Set(["0", "2"]));
    });

    it("should return empty set on invalid regex", () => {
      const result = computeMatches(kLinker, "package", "[invalid");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: version", () => {
    it("should match packages satisfying a semver range", () => {
      const result = computeMatches(kLinker, "version", ">=1.0.0");

      assert.deepEqual(result, new Set(["0", "2"]));
    });

    it("should match packages with exact version preset <1.0.0", () => {
      const result = computeMatches(kLinker, "version", "<1.0.0");

      assert.deepEqual(result, new Set(["1"]));
    });

    it("should return empty set on invalid semver range", () => {
      const result = computeMatches(kLinker, "version", "not-a-semver");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: flag", () => {
    it("should match packages that have the given flag", () => {
      const result = computeMatches(kLinker, "flag", "hasWarnings");

      assert.deepEqual(result, new Set(["0", "1"]));
    });

    it("should match only packages with a specific flag", () => {
      const result = computeMatches(kLinker, "flag", "hasMinifiedCode");

      assert.deepEqual(result, new Set(["1"]));
    });

    it("should return empty set when no package has the flag", () => {
      const result = computeMatches(kLinker, "flag", "isDeprecated");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: license", () => {
    it("should match packages by license regex", () => {
      const result = computeMatches(kLinker, "license", "MIT");

      assert.deepEqual(result, new Set(["0", "1"]));
    });

    it("should match packages with ISC license", () => {
      const result = computeMatches(kLinker, "license", "ISC");

      assert.deepEqual(result, new Set(["1", "2"]));
    });

    it("should return empty set on invalid license regex", () => {
      const result = computeMatches(kLinker, "license", "[invalid");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: ext", () => {
    it("should match packages that have a given extension (with dot)", () => {
      const result = computeMatches(kLinker, "ext", ".ts");

      assert.deepEqual(result, new Set(["0"]));
    });

    it("should match packages that have a given extension (without dot)", () => {
      const result = computeMatches(kLinker, "ext", "ts");

      assert.deepEqual(result, new Set(["0"]));
    });

    it("should match all packages that have .js extension", () => {
      const result = computeMatches(kLinker, "ext", ".js");

      assert.deepEqual(result, new Set(["0", "1", "2"]));
    });

    it("should not match the empty-string extension", () => {
      const result = computeMatches(kLinker, "ext", "");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: builtin", () => {
    it("should match packages using a given Node.js core module by regex", () => {
      const result = computeMatches(kLinker, "builtin", "fs");

      assert.deepEqual(result, new Set(["0"]));
    });

    it("should match packages using path", () => {
      const result = computeMatches(kLinker, "builtin", "path");

      assert.deepEqual(result, new Set(["0", "1"]));
    });

    it("should return empty set when no package uses the module", () => {
      const result = computeMatches(kLinker, "builtin", "crypto");

      assert.deepEqual(result, new Set());
    });

    it("should return empty set on invalid builtin regex", () => {
      const result = computeMatches(kLinker, "builtin", "[invalid");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: size", () => {
    it("should match packages strictly above 100kb", () => {
      // express: 102_400 bytes = 100kb, not >100kb
      const result = computeMatches(kLinker, "size", ">100kb");

      assert.deepEqual(result, new Set());
    });

    it("should match packages at or above 100kb", () => {
      // express: 102_400 bytes = 100kb, matches >=100kb
      const result = computeMatches(kLinker, "size", ">=100kb");

      assert.deepEqual(result, new Set(["0"]));
    });

    it("should match packages below 10kb", () => {
      const result = computeMatches(kLinker, "size", "<10kb");

      assert.deepEqual(result, new Set(["1"]));
    });

    it("should match packages at or above 10kb", () => {
      const result = computeMatches(kLinker, "size", ">=10kb");

      assert.deepEqual(result, new Set(["0", "2"]));
    });

    it("should return empty set on invalid size expression", () => {
      const result = computeMatches(kLinker, "size", "not-a-size");

      assert.deepEqual(result, new Set());
    });
  });

  describe("filter: author", () => {
    it("should match packages whose author is an object with a matching name", () => {
      const result = computeMatches(kLinker, "author", "TJ");

      assert.deepEqual(result, new Set(["0"]));
    });

    it("should match packages whose author is a plain string", () => {
      const result = computeMatches(kLinker, "author", "Dalton");

      assert.deepEqual(result, new Set(["1"]));
    });

    it("should not match packages with null author", () => {
      const result = computeMatches(kLinker, "author", "semver");

      assert.deepEqual(result, new Set());
    });

    it("should return empty set on invalid author regex", () => {
      const result = computeMatches(kLinker, "author", "[invalid");

      assert.deepEqual(result, new Set());
    });
  });
});

describe("getFlagCounts", () => {
  it("should return correct counts per flag name", () => {
    const result = getFlagCounts(kLinker);

    assert.deepEqual(result, new Map([
      ["hasWarnings", 2],
      ["hasIndirectDependencies", 1],
      ["hasMinifiedCode", 1]
    ]));
  });

  it("should return an empty map when no package has flags", () => {
    const emptyLinker = new Map([
      [0, { flags: [] }],
      [1, { flags: [] }]
    ]);

    const result = getFlagCounts(emptyLinker);

    assert.deepEqual(result, new Map());
  });
});

describe("getFilterValueCounts", () => {
  it("should count license occurrences across packages", () => {
    const result = getFilterValueCounts(kLinker, "license");

    assert.deepEqual(result, new Map([
      ["MIT", 2],
      ["ISC", 2]
    ]));
  });

  it("should count ext occurrences, ignoring empty strings", () => {
    const result = getFilterValueCounts(kLinker, "ext");

    assert.deepEqual(result, new Map([
      [".js", 3],
      [".ts", 1]
    ]));
  });

  it("should count builtin module occurrences", () => {
    const result = getFilterValueCounts(kLinker, "builtin");

    assert.deepEqual(result, new Map([
      ["fs", 1],
      ["path", 2]
    ]));
  });

  it("should count author occurrences, skipping null authors", () => {
    const result = getFilterValueCounts(kLinker, "author");

    assert.deepEqual(result, new Map([
      ["TJ Holowaychuk", 1],
      ["John-David Dalton", 1]
    ]));
  });

  it("should return empty map for unknown filter name", () => {
    const result = getFilterValueCounts(kLinker, "unknown");

    assert.deepEqual(result, new Map());
  });
});

describe("getHelperValues", () => {
  it("should return unique licenses as display/value pairs", () => {
    const result = getHelperValues(kLinker, "license");

    assert.deepEqual(result, [
      { display: "MIT", value: "MIT" },
      { display: "ISC", value: "ISC" }
    ]);
  });

  it("should return unique extensions without empty string", () => {
    const result = getHelperValues(kLinker, "ext");

    assert.deepEqual(result, [
      { display: ".js", value: ".js" },
      { display: ".ts", value: ".ts" }
    ]);
  });

  it("should return unique Node.js core modules", () => {
    const result = getHelperValues(kLinker, "builtin");

    assert.deepEqual(result, [
      { display: "fs", value: "fs" },
      { display: "path", value: "path" }
    ]);
  });

  it("should return unique author names, skipping null authors", () => {
    const result = getHelperValues(kLinker, "author");

    assert.deepEqual(result, [
      { display: "TJ Holowaychuk", value: "TJ Holowaychuk" },
      { display: "John-David Dalton", value: "John-David Dalton" }
    ]);
  });

  it("should return empty array for unknown filter name", () => {
    const result = getHelperValues(kLinker, "unknown");

    assert.deepEqual(result, []);
  });
});
