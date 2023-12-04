import { test } from "node:test";
import assert from "node:assert";


// Require Internal Dependencies
import sizeSatisfies from "../index.js";

test("invalid operator always return false", () => {
  assert.strictEqual(sizeSatisfies("!! 45KB", "45KB"), false);
});

test("assert sizeSatisfies", () => {
  assert.strictEqual(sizeSatisfies(">= 45KB", "20MB"), true);
  assert.strictEqual(sizeSatisfies("<= 45KB", "10B"), true);
  assert.strictEqual(sizeSatisfies("= 45KB", "45KB"), true);
  assert.strictEqual(sizeSatisfies("= 45KB", "46KB"), false);
  assert.strictEqual(sizeSatisfies("= 45KB", 2000), false);
  assert.strictEqual(sizeSatisfies("> 45KB", "46KB"), true);
  assert.strictEqual(sizeSatisfies("> 45KB", "45KB"), false);
  assert.strictEqual(sizeSatisfies("< 45KB", "44KB"), true);
});


