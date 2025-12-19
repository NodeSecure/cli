// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import kleur from "../../src/utils/styleText.js";

describe("styleText utility", () => {
  describe("direct style calls", () => {
    it("should apply a single style", () => {
      const result = kleur.red("hello");
      assert.ok(result.includes("hello"), "should contain the text");
      assert.strictEqual(typeof result, "string", "should return a string");
    });

    it("should apply bold modifier", () => {
      const result = kleur.bold("hello");
      assert.ok(result.includes("hello"), "should contain the text");
    });

    it("should apply multiple styles via chaining property access", () => {
      const result = kleur.red.bold("hello");
      assert.ok(result.includes("hello"), "should contain the text");
    });
  });

  describe("chaining with empty call", () => {
    it("should support kleur.color() empty call then method", () => {
      const result = kleur.green().bold("hello");
      assert.ok(result.includes("hello"), "should contain the text");
    });

    it("should support multiple empty calls in chain", () => {
      const result = kleur.cyan().bold().underline("hello");
      assert.ok(result.includes("hello"), "should contain the text");
    });
  });

  describe("non-string value handling", () => {
    it("should convert numbers to strings", () => {
      const result = kleur.yellow(42);
      assert.ok(result.includes("42"), "should contain the number as string");
    });

    it("should handle zero", () => {
      const result = kleur.red(0);
      assert.ok(result.includes("0"), "should contain zero as string");
    });

    it("should handle negative numbers", () => {
      const result = kleur.blue(-5);
      assert.ok(result.includes("-5"), "should contain negative number as string");
    });
  });

  describe("destructuring support", () => {
    it("should work with destructured colors", () => {
      const { red, green, blue } = kleur;
      assert.ok(red("test").includes("test"), "red should work");
      assert.ok(green("test").includes("test"), "green should work");
      assert.ok(blue("test").includes("test"), "blue should work");
    });

    it("should work with destructured modifiers", () => {
      const { bold, italic } = kleur;
      assert.ok(bold("test").includes("test"), "bold should work");
      assert.ok(italic("test").includes("test"), "italic should work");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = kleur.red("");
      assert.strictEqual(typeof result, "string", "should return a string");
    });

    it("should handle special characters", () => {
      const result = kleur.green("hello\nworld");
      assert.ok(result.includes("hello\nworld"), "should preserve special characters");
    });
  });
});
