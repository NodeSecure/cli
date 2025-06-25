// Import Node.js Dependencies
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import cacache from "cacache";
import { warnings } from "@nodesecure/js-x-ray";
import { AppConfig, CACHE_PATH } from "@nodesecure/cache";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { get, set } from "../src/config.js";

// CONSTANTS
const kConfigKey = "___config";

describe("config", () => {
  let actualConfig: AppConfig;

  before(async() => {
    await i18n.getLanguages();
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
        .map(([warning]) => warning) },
      disableExternalRequests: false,
      lang: await i18n.getLocalLang()
    });
  });

  it("should get config from cache", async() => {
    const expectedConfig = {
      defaultPackageMenu: "foo",
      ignore: {
        flags: ["foo"],
        warnings: ["bar"]
      },
      lang: "english",
      theme: "galaxy",
      disableExternalRequests: true
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
      lang: "english",
      theme: "galactic",
      disableExternalRequests: true
    };
    await set(expectedConfig as any);
    const value = await get();

    assert.deepStrictEqual(value, expectedConfig);
  });
});

