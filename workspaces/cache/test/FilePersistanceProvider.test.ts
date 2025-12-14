// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import os from "node:os";
import path from "node:path";

// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import { FilePersistanceProvider } from "../src/FilePersistanceProvider.ts";

describe("FilePersistanceProvider", () => {
  it("PATH should be in os.tmpdir()", () => {
    assert.equal(
      FilePersistanceProvider.PATH,
      path.join(os.tmpdir(), "nsecure-cli")
    );
  });

  describe("get", () => {
    it("should return parsed data on success", async(t) => {
      const expected = { foo: "bar" };
      t.mock.method(cacache, "get", () => {
        return {
          data: Buffer.from(JSON.stringify(expected))
        };
      });

      const provider = new FilePersistanceProvider("test-key");
      const result = await provider.get();

      assert.deepEqual(result, expected);
    });

    it("should return null on error", async(t) => {
      t.mock.method(cacache, "get", () => {
        throw new Error("cache miss");
      });

      const provider = new FilePersistanceProvider("test-key");
      const result = await provider.get();

      assert.equal(result, null);
    });
  });

  describe("set", () => {
    it("should return true on success", async(t) => {
      t.mock.method(cacache, "put", () => Promise.resolve());

      const provider = new FilePersistanceProvider("test-key");
      const result = await provider.set({ foo: "bar" });

      assert.equal(result, true);
    });

    it("should call cacache.put with correct arguments", async(t) => {
      const putMock = t.mock.method(cacache, "put", () => Promise.resolve());

      const provider = new FilePersistanceProvider<{ foo: string; }>("my-key");
      await provider.set({ foo: "bar" });

      assert.equal(putMock.mock.calls.length, 1);
      assert.deepEqual(putMock.mock.calls[0].arguments, [
        FilePersistanceProvider.PATH,
        "my-key",
        JSON.stringify({ foo: "bar" })
      ]);
    });

    it("should return false on error", async(t) => {
      t.mock.method(cacache, "put", () => {
        throw new Error("write error");
      });

      const provider = new FilePersistanceProvider("test-key");
      const result = await provider.set({ foo: "bar" });

      assert.equal(result, false);
    });
  });

  describe("remove", () => {
    it("should call cacache.rm with correct arguments", async(t) => {
      const rmMock = t.mock.method(cacache, "rm", () => Promise.resolve());

      const provider = new FilePersistanceProvider("remove-key");
      await provider.remove();

      assert.equal(rmMock.mock.calls.length, 1);
      assert.deepEqual(rmMock.mock.calls[0].arguments, [
        FilePersistanceProvider.PATH,
        "remove-key"
      ]);
    });
  });
});
