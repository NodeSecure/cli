// Import Node.js Dependencies
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import { warnings, type Warning } from "@nodesecure/js-x-ray";
import {
  FilePersistanceProvider
} from "@nodesecure/cache";

// Import Internal Dependencies
import {
  getProvider,
  get,
  set,
  type WebUISettings
} from "../src/config.ts";

describe("config", () => {
  let currentConfig: WebUISettings;
  let filePersistance: FilePersistanceProvider<WebUISettings>;
  before(async() => {
    currentConfig = await get();
  });

  beforeEach(async() => {
    filePersistance = getProvider();
    await filePersistance.remove();
  });

  after(async() => {
    await filePersistance.remove();
    await set(currentConfig);
  });

  it("should get default config from empty cache", async() => {
    const value = await get();

    assert.deepStrictEqual(value, {
      defaultPackageMenu: "info",
      ignore: {
        flags: [],
        warnings: Object.entries(warnings as unknown as Warning[])
          .filter(([_, { experimental }]) => experimental)
          .map(([warning]) => warning)
      },
      disableExternalRequests: false
    });
  });

  it("should get config from cache", async() => {
    const expectedConfig: WebUISettings = {
      defaultPackageMenu: "foo",
      ignore: {
        flags: ["foo"],
        warnings: []
      },
      theme: "light",
      disableExternalRequests: true
    };

    await filePersistance.set(expectedConfig);
    const value = await get();

    assert.deepStrictEqual(value, expectedConfig);
  });

  it("should set config in cache", async() => {
    const expectedConfig: WebUISettings = {
      defaultPackageMenu: "foo",
      ignore: {
        flags: ["foz"],
        warnings: []
      },
      theme: "light",
      disableExternalRequests: true
    };
    await set(expectedConfig);
    const value = await get();

    assert.deepStrictEqual(value, expectedConfig);
  });
});

