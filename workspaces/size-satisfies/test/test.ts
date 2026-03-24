// Import Node.js Dependencies
import { test } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import sizeSatisfies from "../src/index.ts";

test("return false for empty pattern", () => {
  assert.strictEqual(sizeSatisfies("", "45KB"), false);
});

test("return false for pattern without operator", () => {
  assert.strictEqual(sizeSatisfies("45KB", "45KB"), false);
});

test("return false for invalid operator", () => {
  assert.strictEqual(sizeSatisfies("!! 45KB", "45KB"), false);
});

test("pattern with only an operator treats patternSize as 0", () => {
  assert.strictEqual(sizeSatisfies(">=", "45KB"), true);
  assert.strictEqual(sizeSatisfies(">", "0KB"), false);
  assert.strictEqual(sizeSatisfies("=", "0KB"), true);
  assert.strictEqual(sizeSatisfies("<", "45KB"), false);
});

test("size as a numeric value", () => {
  assert.strictEqual(sizeSatisfies(">= 45KB", 46080), true);
  assert.strictEqual(sizeSatisfies("= 45KB", 46080), true);
  assert.strictEqual(sizeSatisfies("= 45KB", 2000), false);
  assert.strictEqual(sizeSatisfies("< 45KB", 0), true);
});

test("size as an unparseable string falls back to 0", () => {
  assert.strictEqual(sizeSatisfies("> 0KB", "not_a_size"), false);
  assert.strictEqual(sizeSatisfies("= 0KB", "not_a_size"), true);
  assert.strictEqual(sizeSatisfies("<= 10KB", "not_a_size"), true);
});

test("unparseable patternSize falls back to 0", () => {
  assert.strictEqual(sizeSatisfies(">= not_a_size", "10KB"), true);
  assert.strictEqual(sizeSatisfies("= not_a_size", 0), true);
  assert.strictEqual(sizeSatisfies("> not_a_size", 0), false);
});

test(">= operator", () => {
  assert.strictEqual(sizeSatisfies(">= 45KB", "20MB"), true);
  assert.strictEqual(sizeSatisfies(">= 45KB", "45KB"), true);
  assert.strictEqual(sizeSatisfies(">= 45KB", "10B"), false);
});

test("<= operator", () => {
  assert.strictEqual(sizeSatisfies("<= 45KB", "10B"), true);
  assert.strictEqual(sizeSatisfies("<= 45KB", "45KB"), true);
  assert.strictEqual(sizeSatisfies("<= 45KB", "20MB"), false);
});

test("= operator", () => {
  assert.strictEqual(sizeSatisfies("= 45KB", "45KB"), true);
  assert.strictEqual(sizeSatisfies("= 45KB", "46KB"), false);
});

test("> operator", () => {
  assert.strictEqual(sizeSatisfies("> 45KB", "46KB"), true);
  assert.strictEqual(sizeSatisfies("> 45KB", "45KB"), false);
  assert.strictEqual(sizeSatisfies("> 45KB", "44KB"), false);
});

test("< operator", () => {
  assert.strictEqual(sizeSatisfies("< 45KB", "44KB"), true);
  assert.strictEqual(sizeSatisfies("< 45KB", "45KB"), false);
  assert.strictEqual(sizeSatisfies("< 45KB", "46KB"), false);
});

