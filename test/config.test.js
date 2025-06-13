// Import Node.js Dependencies
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import cacache from "cacache";
import { warnings } from "@nodesecure/js-x-ray";

// Import Internal Dependencies
import { get, set } from "../src/http-server/config.js";
import { CACHE_PATH } from "../src/cache.js";

// CONSTANTS
const kConfigKey = "___config";

describe("config", { concurrency: 1 }, () => {
  let actualConfig;

  before(async() => {
    actualConfig = await get();
  });

  after(async() => {
    await set(actualConfig);
  });

  it("should get default config from empty cache", async() => {
    await cacache.rm(CACHE_PATH, kConfigKey);
    const value = await get();

    assert.deepStrictEqual(value, {
      defaultPackageMenu: "info",
      ignore: { flags: [], warnings: Object.entries(warnings)
        .filter(([_, { experimental }]) => experimental)
        .map(([warning]) => warning) }
    });
  });

  it("should get config from cache", async() => {
    const expectedConfig = {
      defaultPackageMenu: "foo",
      ignore: {
        flags: ["foo"],
        warnings: ["bar"]
      },
      theme: "galaxy"
    };
    await cacache.put(CACHE_PATH, kConfigKey, JSON.stringify(expectedConfig));
    const value = await get();

    assert.deepStrictEqual(value, expectedConfig);
  });

  it("should set config in cache", async() => {
    const expectedConfig = {
      defaultPackageMenu: "foz",
      ignore: {
        flags: ["foz"],
        warnings: ["baz"]
      },
      theme: "galactic"
    };
    await set(expectedConfig);
    const value = await get();

    assert.deepStrictEqual(value, expectedConfig);
  });
});

