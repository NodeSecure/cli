// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import { get, set } from "../src/http-server/config.js";

// CONSTANTS
const kCachePath = path.join(os.tmpdir(), "nsecure-cli");
const kConfigKey = "cli-config";

describe("config", () => {
  let actualConfig;

  before(async() => {
    actualConfig = await get();
  });

  after(async() => {
    await set(actualConfig);
  });

  it("should get default config from empty cache", async() => {
    await cacache.rm(kCachePath, kConfigKey);
    const value = await get();

    assert.deepStrictEqual(value, {
      defaultPackageMenu: "info",
      ignore: { flags: [], warnings: [] }
    });
  });

  it("should get config from cache", async() => {
    await cacache.put(kCachePath, kConfigKey, JSON.stringify({ foo: "bar" }));
    const value = await get();

    assert.deepStrictEqual(value, { foo: "bar" });
  });

  it("should set config in cache", async() => {
    await set({ foo: "baz" });
    const value = await get();

    assert.deepStrictEqual(value, { foo: "baz" });
  });
});

