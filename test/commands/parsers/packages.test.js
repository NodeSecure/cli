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
  });

  describe("returns Record when at least one entry has a version constraint", () => {
    it("should parse a package with a semver range", () => {
      assert.deepEqual(parsePackages("lodash@^4.0.0"), { lodash: "^4.0.0" });
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
  });

  describe("edge cases", () => {
    it("should return an empty array for an empty array input", () => {
      assert.deepEqual(parsePackages([]), []);
    });

    it("should treat a scoped name with no slash and no version as a plain package name", () => {
      assert.deepEqual(parsePackages("@scope"), ["@scope"]);
    });
  });
});
