// Import Node.js Dependencies
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import { appCache } from "../src/cache.js";
import * as config from "../src/http-server/config.js";

// CONSTANTS
const kPayloadsPath = path.join(os.homedir(), ".nsecure", "payloads");

describe("appCache", () => {
  let actualConfig;

  before(async() => {
    appCache.prefix = "test_runner";
    actualConfig = await config.get();
  });

  after(async() => {
    await config.set(actualConfig);
  });

  it("should update and get config", async() => {
    await appCache.updateConfig({ foo: "bar" });

    const updated = await appCache.getConfig();
    assert.deepEqual(updated, { foo: "bar" });
  });

  it("should write payload into ~/.nsecure/payloads", (t) => {
    let writePath;
    let writeValue;
    t.mock.method(fs, "writeFileSync", (path, value) => {
      writePath = path;
      writeValue = value;
    });

    appCache.updatePayload("foo/bar", { foo: "bar" });

    assert.equal(writePath, path.join(kPayloadsPath, "foo______bar"));
    assert.equal(writeValue, JSON.stringify({ foo: "bar" }));
  });

  it("should throw given a package name that contains the slash replace token", () => {
    assert.throws(() => appCache.updatePayload("foo______bar", { foo: "bar" }), {
      message: "Invalid package name: foo______bar"
    });
  });

  it("getPayload should return the payload", (t) => {
    t.mock.method(fs, "readFileSync", () => JSON.stringify({ foo: "bar" }));

    const payload = appCache.getPayload("foo/bar");

    assert.deepEqual(payload, { foo: "bar" });
  });

  it("getPayload should throw", (t) => {
    t.mock.method(fs, "readFileSync", () => {
      throw new Error("boo");
    });

    assert.throws(() => appCache.getPayload("foo/bar"), {
      message: "boo"
    });
  });

  it("getPayloadOrNull should return payload", (t) => {
    t.mock.method(fs, "readFileSync", () => JSON.stringify({ foo: "bar" }));

    const payload = appCache.getPayloadOrNull("foo/bar");

    assert.deepEqual(payload, { foo: "bar" });
  });

  it("getPayloadOrNull should return null", (t) => {
    t.mock.method(fs, "readFileSync", () => {
      throw new Error("boo");
    });

    const payload = appCache.getPayloadOrNull("foo/bar");

    assert.equal(payload, null);
  });

  it("availablePayloads should return the list of payloads", (t) => {
    t.mock.method(fs, "readdirSync", () => ["foo-bar", "bar-foo"]);

    const payloads = appCache.availablePayloads();

    assert.deepEqual(payloads, ["foo-bar", "bar-foo"]);
  });

  it("should update and get payloadsList", async() => {
    await appCache.updatePayloadsList({ foo: "bar" });

    const updated = await appCache.payloadsList();
    assert.deepEqual(updated, { foo: "bar" });
  });

  it("payloadList should throw", async(t) => {
    t.mock.method(cacache, "get", () => {
      throw new Error("boo");
    });

    await assert.rejects(async() => appCache.payloadsList(), {
      message: "boo"
    });
  });

  it("should init payloadsList when starting from zero", async(t) => {
    appCache.startFromZero = true;
    t.mock.method(fs, "readdirSync", () => []);
    t.mock.method(cacache, "get", () => {
      throw new Error("boo");
    });

    await appCache.initPayloadsList();

    t.mock.reset();

    const payloadsList = await appCache.payloadsList();

    assert.deepEqual(payloadsList, {
      mru: [],
      lru: [],
      current: null,
      availables: [],
      lastUsed: {},
      root: null
    });
  });

  it("should init payloadsList with the root payload json", async(t) => {
    appCache.startFromZero = false;
    t.mock.method(fs, "readdirSync", () => []);
    t.mock.method(fs, "readFileSync", () => JSON.stringify({
      rootDependencyName: "test_runner",
      dependencies: {
        test_runner: {
          versions: {
            "1.0.0": {}
          }
        }
      }
    }));
    t.mock.method(fs, "writeFileSync", () => void 0);
    t.mock.method(cacache, "get", () => {
      throw new Error("boo");
    });
    t.mock.method(Date, "now", () => 1234567890);

    await appCache.initPayloadsList();

    t.mock.reset();

    const payloadsList = await appCache.payloadsList();

    assert.deepEqual(payloadsList, {
      mru: ["test_runner@1.0.0"],
      lru: [],
      current: "test_runner@1.0.0",
      availables: [],
      lastUsed: { "test_runner@1.0.0": 1234567890 },
      root: "test_runner@1.0.0"
    });
  });

  it("should init payloadsList.older with already scanned payloads", async(t) => {
    t.mock.method(fs, "readdirSync", () => ["test_runner@1.0.0", "test_runner@2.0.0"]);
    t.mock.method(cacache, "get", () => {
      throw new Error("boo");
    });

    await appCache.initPayloadsList();

    t.mock.reset();

    const payloadsList = await appCache.payloadsList();

    assert.deepEqual(payloadsList, {
      availables: ["test_runner@1.0.0", "test_runner@2.0.0"],
      current: null,
      mru: [],
      lru: []
    });
  });

  it("should remove payload from disk", (t) => {
    let removedPath;
    t.mock.method(fs, "rmSync", (path) => {
      removedPath = path;
    });

    appCache.removePayload("foo/bar");

    assert.equal(removedPath, path.join(kPayloadsPath, "foo______bar"));
  });

  it("should not remove the last MRU when MRU is not full", async(t) => {
    t.mock.method(cacache, "get", () => {
      return {
        data: {
          toString: () => JSON.stringify({
            mru: ["foo"],
            lru: ["bar"],
            availables: [],
            lastUsed: { foo: 1234567890 },
            foo: "bar"
          })
        }
      };
    });

    const result = await appCache.removeLastMRU();

    assert.deepEqual(result, {
      mru: ["foo"],
      lru: ["bar"],
      availables: [],
      lastUsed: { foo: 1234567890 },
      foo: "bar"
    });
  });

  it("should remove the last MRU when MRU is full", async(t) => {
    t.mock.method(cacache, "get", () => {
      return {
        data: {
          toString: () => JSON.stringify({
            mru: ["foo", "foz", "bar"],
            lru: ["boz"],
            availables: [],
            lastUsed: {
              foo: 123,
              foz: 1234,
              bar: 12345
            },
            foo: "bar"
          })
        }
      };
    });

    const result = await appCache.removeLastMRU();

    assert.deepEqual(result, {
      mru: ["foz", "bar"],
      lru: ["boz", "foo"],
      availables: [],
      lastUsed: {
        foo: 123,
        foz: 1234,
        bar: 12345
      },
      foo: "bar"
    });
  });

  it("should set local root payload", async(t) => {
    t.mock.method(fs, "writeFileSync", () => void 0);
    t.mock.method(Date, "now", () => 1234567890);
    await appCache.updatePayloadsList({
      mru: [],
      lru: [],
      current: null,
      availables: [],
      lastUsed: {},
      root: null
    });
    const payload = {
      rootDependencyName: "test_runner-local",
      dependencies: {
        "test_runner-local": {
          versions: {
            "1.0.0": {}
          }
        }
      }
    };
    await appCache.setRootPayload(payload, { local: true });

    const result = await appCache.payloadsList();

    assert.deepEqual(result, {
      mru: ["test_runner-local@1.0.0#local"],
      lru: [],
      current: "test_runner-local@1.0.0#local",
      availables: [],
      lastUsed: {
        "test_runner-local@1.0.0#local": 1234567890
      },
      root: "test_runner-local@1.0.0#local"
    });
  });

  it("should set normal root payload", async(t) => {
    t.mock.method(fs, "writeFileSync", () => void 0);
    t.mock.method(Date, "now", () => 1234567890);
    await appCache.updatePayloadsList({
      mru: [],
      lru: [],
      current: null,
      availables: [],
      lastUsed: {},
      root: null
    });
    const payload = {
      rootDependencyName: "test_runner-local",
      dependencies: {
        "test_runner-local": {
          versions: {
            "1.0.0": {}
          }
        }
      }
    };
    await appCache.setRootPayload(payload, {});

    const result = await appCache.payloadsList();

    assert.deepEqual(result, {
      mru: ["test_runner-local@1.0.0"],
      lru: [],
      current: "test_runner-local@1.0.0",
      availables: [],
      lastUsed: {
        "test_runner-local@1.0.0": 1234567890
      },
      root: "test_runner-local@1.0.0"
    });
  });
});
