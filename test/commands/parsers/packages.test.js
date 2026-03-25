// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import Internal Dependencies
import { parsePackages } from "../../../src/commands/parsers/packages.js";

describe("packages parser", () => {
  describe("returns string[] when no version constraints", () => {
    it("should parse a single plain package name", () => {
      assert.deepEqual(parsePackages("lodash"), ["lodash"]);
    });

    it("should parse a single scoped package with no version", () => {
      assert.deepEqual(parsePackages("@scope/pkg"), ["@scope/pkg"]);
    });

    it("should parse multiple plain packages with no versions", () => {
      assert.deepEqual(parsePackages(["lodash", "express"]), ["lodash", "express"]);
    });

    it("should trim package names", () => {
      assert.deepEqual(parsePackages("  lodash  "), ["lodash"]);
    });
  });

  describe("returns Record when at least one entry has a version constraint", () => {
    it("should parse a package with a semver range", () => {
      assert.deepEqual(parsePackages("lodash@^4.0.0"), { lodash: "^4.0.0" });
    });

    it("should parse a package with a list of specific versions", () => {
      assert.deepEqual(parsePackages("lodash@1.0.0,2.0.0"), { lodash: ["1.0.0", "2.0.0"] });
    });

    it("should parse a scoped package with a semver range", () => {
      assert.deepEqual(parsePackages("@scope/pkg@^1.0.0"), { "@scope/pkg": "^1.0.0" });
    });

    it("should map entries without a version to '*' when mixed with versioned entries", () => {
      assert.deepEqual(
        parsePackages(["lodash", "express@^4.0.0"]),
        { lodash: "*", express: "^4.0.0" }
      );
    });

    it("should parse multiple packages all with version constraints", () => {
      assert.deepEqual(
        parsePackages(["lodash@^4.0.0", "express@^4.18.0"]),
        { lodash: "^4.0.0", express: "^4.18.0" }
      );
    });

    it("should trim version strings", () => {
      assert.deepEqual(parsePackages("lodash@ ^4.0.0 "), { lodash: "^4.0.0" });
    });

    it("should trim individual versions in a comma-separated list", () => {
      assert.deepEqual(parsePackages("lodash@1.0.0 , 2.0.0"), { lodash: ["1.0.0", "2.0.0"] });
    });
  });

  describe("JSON array string input", () => {
    it("should parse a JSON array string of plain packages", () => {
      assert.deepEqual(
        parsePackages('["@hapi/formula@3.0.2", "@hapi/tlds@1.1.6"]'),
        { "@hapi/formula": "3.0.2", "@hapi/tlds": "1.1.6" }
      );
    });

    it("should parse a JSON array string with no version constraints", () => {
      assert.deepEqual(
        parsePackages('["lodash", "express"]'),
        ["lodash", "express"]
      );
    });

    it("should fall through to plain string parsing for invalid JSON starting with '['", () => {
      assert.deepEqual(parsePackages("[notjson"), ["[notjson"]);
    });
  });

  describe("edge cases", () => {
    it("should return an empty array for an empty array input", () => {
      assert.deepEqual(parsePackages([]), []);
    });

    it("should treat a scoped name with no slash and no version as a plain package name", () => {
      assert.deepEqual(parsePackages("@scope"), ["@scope"]);
    });

    it("should treat a trailing '@' with no version as no version constraint", () => {
      assert.deepEqual(parsePackages("lodash@"), ["lodash"]);
    });

    it("should treat a scoped package with trailing '@' as no version constraint", () => {
      assert.deepEqual(parsePackages("@scope/pkg@"), ["@scope/pkg"]);
    });

    it("should ignore a trailing comma in a version list", () => {
      assert.deepEqual(parsePackages("lodash@1.0.0,"), { lodash: "1.0.0" });
    });

    it("should treat a lone comma as version as no version constraint", () => {
      assert.deepEqual(parsePackages("lodash@,"), ["lodash"]);
    });
  });
});
