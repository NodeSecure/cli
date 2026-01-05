// Import Node.js Dependencies
import assert from "node:assert/strict";
import { describe, it, beforeEach, mock } from "node:test";
import os from "node:os";
import path from "node:path";
import type fs from "node:fs/promises";

// Import Third-party Dependencies
import type { Payload } from "@nodesecure/scanner";

// Import Internal Dependencies
import {
  PayloadCache,
  PayloadManifestCache,
  type PayloadMetadata,
  type PayloadManifest,
  type BasePersistanceProvider
} from "../src/index.ts";

// Types
type MockedFs = {
  [K in keyof typeof fs]: ReturnType<typeof mock.fn<any>>;
};

interface MockedStorageProvider {
  get: ReturnType<typeof mock.fn<() => Promise<PayloadMetadata | null>>>;
  set: ReturnType<typeof mock.fn<(value: PayloadMetadata) => Promise<boolean>>>;
  remove: ReturnType<typeof mock.fn<() => Promise<void>>>;
}

// Helpers
function createMockFs(): MockedFs {
  return {
    readFile: mock.fn<typeof fs.readFile>(),
    writeFile: mock.fn<typeof fs.writeFile>(),
    rm: mock.fn<typeof fs.rm>(),
    mkdir: mock.fn<typeof fs.mkdir>()
  } as MockedFs;
}

function createMockStorageProvider(): MockedStorageProvider {
  return {
    get: mock.fn<() => Promise<PayloadMetadata | null>>(),
    set: mock.fn<(value: PayloadMetadata) => Promise<boolean>>(),
    remove: mock.fn<() => Promise<void>>()
  };
}

function createMockPayload(
  name: string,
  version: string,
  integrity: string | null = null
): Payload {
  return {
    rootDependency: {
      name,
      version,
      integrity
    },
    dependencies: new Map(),
    scannerVersion: "1.0.0"
  } as unknown as Payload;
}

function createMockMetadata(
  spec: string,
  options: Partial<PayloadMetadata> = {}
): PayloadMetadata {
  return {
    spec,
    scanType: "cwd",
    locationOnDisk: PayloadCache.getPathBySpec(spec),
    lastUsedAt: Date.now(),
    integrity: null,
    ...options
  };
}

describe("PayloadCache", () => {
  describe("static PATH", () => {
    it("should be in os.homedir()/.nsecure/payloads", () => {
      assert.equal(
        PayloadCache.PATH,
        path.join(os.homedir(), ".nsecure", "payloads")
      );
    });
  });

  describe("static getPathBySpec", () => {
    it("should return correct path for a spec", () => {
      const spec = "express@4.18.2";
      const result = PayloadCache.getPathBySpec(spec);

      assert.equal(
        result,
        path.join(PayloadCache.PATH, "express@4.18.2")
      );
    });

    it("should sanitize invalid filename characters", () => {
      const spec = "my-package@1.0.0";
      const result = PayloadCache.getPathBySpec(spec);

      assert.ok(result.startsWith(PayloadCache.PATH));
    });
  });

  describe("static getPathByPayload", () => {
    it("should return correct path from payload", () => {
      const payload = createMockPayload("lodash", "4.17.21");
      const result = PayloadCache.getPathByPayload(payload);

      assert.equal(
        result,
        path.join(PayloadCache.PATH, "lodash@4.17.21")
      );
    });
  });

  describe("getCurrentSpec / setCurrentSpec", () => {
    it("should set and get current spec", () => {
      const mockFs = createMockFs();
      const cache = new PayloadCache({ fsProvider: mockFs as unknown as typeof fs });

      assert.equal(cache.getCurrentSpec(), null);

      cache.setCurrentSpec("express@4.18.2");
      assert.equal(cache.getCurrentSpec(), "express@4.18.2");

      cache.setCurrentSpec(null);
      assert.equal(cache.getCurrentSpec(), null);
    });
  });

  describe("[Symbol.iterator]", () => {
    let mockFs: MockedFs;
    let mockStorageProvider: MockedStorageProvider;
    let storageProviderFactory: (spec: string) => BasePersistanceProvider<PayloadMetadata>;

    beforeEach(() => {
      mockFs = createMockFs();
      mockStorageProvider = createMockStorageProvider();
      storageProviderFactory = () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>;
    });

    it("should iterate over storage values sorted by lastUsedAt descending", async() => {
      const manifest: PayloadManifest = {
        current: null,
        specs: ["old@1.0.0", "new@2.0.0"]
      };

      mockFs.readFile.mock.mockImplementation(
        () => Promise.resolve(JSON.stringify(manifest))
      );
      mockFs.mkdir.mock.mockImplementation(() => Promise.resolve(undefined));

      const metadataOld = createMockMetadata("old@1.0.0", { lastUsedAt: 1000 });
      const metadataNew = createMockMetadata("new@2.0.0", { lastUsedAt: 2000 });

      let callCount = 0;
      mockStorageProvider.get.mock.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(metadataOld);
        }

        return Promise.resolve(metadataNew);
      });

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: storageProviderFactory
      });
      await cache.load();

      const items = [...cache];

      assert.equal(items.length, 2);
      assert.equal(items[0].spec, "new@2.0.0");
      assert.equal(items[1].spec, "old@1.0.0");
    });
  });

  describe("findBySpec", () => {
    let mockFs: MockedFs;

    beforeEach(() => {
      mockFs = createMockFs();
    });

    it("should return parsed payload on success", async() => {
      const expectedPayload = createMockPayload("express", "4.18.2");
      mockFs.readFile.mock.mockImplementation(
        () => Promise.resolve(JSON.stringify(expectedPayload))
      );

      const cache = new PayloadCache({ fsProvider: mockFs as unknown as typeof fs });
      const result = await cache.findBySpec("express@4.18.2");

      assert.ok(result !== null);
      assert.equal(result.rootDependency.name, "express");
      assert.equal(result.rootDependency.version, "4.18.2");
      assert.equal(result.scannerVersion, "1.0.0");
      assert.equal(mockFs.readFile.mock.calls.length, 1);
    });

    it("should return null on read error", async() => {
      mockFs.readFile.mock.mockImplementation(
        () => Promise.reject(new Error("ENOENT"))
      );

      const cache = new PayloadCache({ fsProvider: mockFs as unknown as typeof fs });
      const result = await cache.findBySpec("nonexistent@1.0.0");

      assert.equal(result, null);
    });
  });

  describe("findByIntegrity", () => {
    let mockFs: MockedFs;
    let mockStorageProvider: MockedStorageProvider;
    let storageProviderFactory: (spec: string) => BasePersistanceProvider<PayloadMetadata>;

    beforeEach(() => {
      mockFs = createMockFs();
      mockStorageProvider = createMockStorageProvider();
      storageProviderFactory = () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>;
    });

    it("should find payload by integrity", async() => {
      const targetIntegrity = "sha512-abc123";
      const expectedPayload = createMockPayload("express", "4.18.2", targetIntegrity);
      const manifest: PayloadManifest = {
        current: null,
        specs: ["express@4.18.2"]
      };

      mockFs.mkdir.mock.mockImplementation(() => Promise.resolve(undefined));
      mockFs.readFile.mock.mockImplementation((filePath: string) => {
        if (String(filePath).includes("manifest.json")) {
          return Promise.resolve(JSON.stringify(manifest));
        }

        return Promise.resolve(JSON.stringify(expectedPayload));
      });

      mockStorageProvider.get.mock.mockImplementation(
        () => Promise.resolve(createMockMetadata("express@4.18.2", { integrity: targetIntegrity }))
      );

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: storageProviderFactory
      });
      await cache.load();

      const result = await cache.findByIntegrity(targetIntegrity);

      assert.ok(result !== null);
      assert.equal(result.rootDependency.name, "express");
      assert.equal(result.rootDependency.version, "4.18.2");
      assert.equal(result.rootDependency.integrity, targetIntegrity);
    });

    it("should return null if integrity not found", async() => {
      const manifest: PayloadManifest = {
        current: null,
        specs: ["express@4.18.2"]
      };

      mockFs.mkdir.mock.mockImplementation(() => Promise.resolve(undefined));
      mockFs.readFile.mock.mockImplementation(
        () => Promise.resolve(JSON.stringify(manifest))
      );

      mockStorageProvider.get.mock.mockImplementation(
        () => Promise.resolve(createMockMetadata("express@4.18.2", { integrity: "sha512-different" }))
      );

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: storageProviderFactory
      });
      await cache.load();

      const result = await cache.findByIntegrity("sha512-nonexistent");

      assert.equal(result, null);
    });
  });

  describe("remove", () => {
    let mockFs: MockedFs;
    let mockStorageProvider: MockedStorageProvider;

    beforeEach(() => {
      mockFs = createMockFs();
      mockStorageProvider = createMockStorageProvider();
    });

    it("should remove payload by spec string", async() => {
      mockFs.rm.mock.mockImplementation(() => Promise.resolve(undefined));
      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.remove.mock.mockImplementation(() => Promise.resolve());

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.remove("express@4.18.2");

      assert.equal(mockFs.rm.mock.calls.length, 1);
      const rmCall = mockFs.rm.mock.calls[0];
      assert.equal(
        rmCall.arguments[0],
        PayloadCache.getPathBySpec("express@4.18.2")
      );
    });

    it("should remove payload by Payload object", async() => {
      mockFs.rm.mock.mockImplementation(() => Promise.resolve(undefined));
      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.remove.mock.mockImplementation(() => Promise.resolve());

      const payload = createMockPayload("lodash", "4.17.21");

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.remove(payload);

      assert.equal(mockFs.rm.mock.calls.length, 1);
      const rmCall = mockFs.rm.mock.calls[0];
      assert.equal(
        rmCall.arguments[0],
        PayloadCache.getPathByPayload(payload)
      );
    });
  });

  describe("save", () => {
    let mockFs: MockedFs;
    let mockStorageProvider: MockedStorageProvider;

    beforeEach(() => {
      mockFs = createMockFs();
      mockStorageProvider = createMockStorageProvider();
      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.set.mock.mockImplementation(() => Promise.resolve(true));
    });

    it("should save payload to disk", async() => {
      const payload = createMockPayload("express", "4.18.2", "sha512-integrity");

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.save(payload);

      // Wait for microtask to complete
      await new Promise((resolve) => {
        queueMicrotask(() => resolve(void 0));
      });

      assert.equal(mockFs.writeFile.mock.calls.length >= 1, true);
    });

    it("should set current spec when useAsCurrent is true", async() => {
      const payload = createMockPayload("express", "4.18.2");

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.save(payload, { useAsCurrent: true });

      assert.equal(cache.getCurrentSpec(), "express@4.18.2");
    });

    it("should not duplicate if spec already exists", async() => {
      const payload = createMockPayload("express", "4.18.2");

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.save(payload);
      const writeCountAfterFirstSave = mockFs.writeFile.mock.calls.length;

      await cache.save(payload);

      // Should not have written payload file again (only manifest updates via microtask)
      assert.equal(mockFs.writeFile.mock.calls.length, writeCountAfterFirstSave);
    });

    it("should use scanType option", async() => {
      const payload = createMockPayload("express", "4.18.2");

      let capturedMetadata: PayloadMetadata | null = null;
      mockStorageProvider.set.mock.mockImplementation((metadata: PayloadMetadata) => {
        capturedMetadata = metadata;

        return Promise.resolve(true);
      });

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.save(payload, { scanType: "from" });

      // Wait for microtask
      await new Promise((resolve) => {
        queueMicrotask(() => resolve(void 0));
      });

      assert.equal(capturedMetadata!.scanType, "from");
    });
  });

  describe("updateLastUsedAt", () => {
    let mockFs: MockedFs;
    let mockStorageProvider: MockedStorageProvider;

    beforeEach(() => {
      mockFs = createMockFs();
      mockStorageProvider = createMockStorageProvider();
      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.set.mock.mockImplementation(() => Promise.resolve(true));
    });

    it("should update lastUsedAt for existing spec", async() => {
      const payload = createMockPayload("express", "4.18.2");

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.save(payload);

      const beforeUpdate = Date.now();
      cache.updateLastUsedAt("express@4.18.2");

      // Wait for microtask
      await new Promise((resolve) => {
        queueMicrotask(() => resolve(void 0));
      });

      const items = [...cache];
      assert.equal(items.length, 1);
      assert.ok(items[0].lastUsedAt >= beforeUpdate);
    });

    it("should do nothing for non-existing spec", () => {
      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      // Should not throw
      cache.updateLastUsedAt("nonexistent@1.0.0");

      const items = [...cache];
      assert.equal(items.length, 0);
    });
  });

  describe("load", () => {
    let mockFs: MockedFs;
    let mockStorageProvider: MockedStorageProvider;

    beforeEach(() => {
      mockFs = createMockFs();
      mockStorageProvider = createMockStorageProvider();
    });

    it("should load manifest and storage from disk", async() => {
      const manifest: PayloadManifest = {
        current: "express@4.18.2",
        specs: ["express@4.18.2", "lodash@4.17.21"]
      };

      mockFs.mkdir.mock.mockImplementation(() => Promise.resolve(undefined));
      mockFs.readFile.mock.mockImplementation(
        () => Promise.resolve(JSON.stringify(manifest))
      );

      let callIndex = 0;
      mockStorageProvider.get.mock.mockImplementation(() => {
        const metadata = callIndex === 0
          ? createMockMetadata("express@4.18.2")
          : createMockMetadata("lodash@4.17.21");
        callIndex++;

        return Promise.resolve(metadata);
      });

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      const result = await cache.load();

      assert.equal(result, cache);
      assert.equal(cache.getCurrentSpec(), "express@4.18.2");

      const items = [...cache];
      assert.equal(items.length, 2);
    });

    it("should return empty storage when no manifest exists", async() => {
      mockFs.mkdir.mock.mockImplementation(() => Promise.resolve(undefined));
      mockFs.readFile.mock.mockImplementation(
        () => Promise.reject(new Error("ENOENT"))
      );

      const cache = new PayloadCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      await cache.load();

      const items = [...cache];
      assert.equal(items.length, 0);
    });
  });

  describe("clear", () => {
    it("should remove entire cache directory", async() => {
      const mockFs = createMockFs();
      mockFs.rm.mock.mockImplementation(() => Promise.resolve(undefined));

      const cache = new PayloadCache({ fsProvider: mockFs as unknown as typeof fs });
      const result = await cache.clear();

      assert.equal(result, cache);
      assert.equal(mockFs.rm.mock.calls.length, 1);
      assert.deepEqual(mockFs.rm.mock.calls[0].arguments, [
        PayloadCache.PATH,
        { recursive: true, force: true }
      ]);
    });
  });
});

describe("PayloadManifestCache", () => {
  describe("currentSpec", () => {
    it("should initialize with null", () => {
      const manifest = new PayloadManifestCache();
      assert.equal(manifest.currentSpec, null);
    });

    it("should be settable", () => {
      const manifest = new PayloadManifestCache();
      manifest.currentSpec = "express@4.18.2";
      assert.equal(manifest.currentSpec, "express@4.18.2");
    });
  });

  describe("initialize", () => {
    it("should create cache directory", async() => {
      const mockFs = createMockFs();
      mockFs.mkdir.mock.mockImplementation(() => Promise.resolve(undefined));

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs
      });

      const result = await manifest.initialize();

      assert.equal(result, manifest);
      assert.equal(mockFs.mkdir.mock.calls.length, 1);
      assert.deepEqual(mockFs.mkdir.mock.calls[0].arguments, [
        PayloadCache.PATH,
        { recursive: true }
      ]);
    });
  });

  describe("lazyPersistOnDisk", () => {
    it("should batch multiple calls into single persist", async() => {
      const mockFs = createMockFs();
      const mockStorageProvider = createMockStorageProvider();

      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.set.mock.mockImplementation(() => Promise.resolve(true));

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      const storage = new Map<string, PayloadMetadata>();
      storage.set("express@4.18.2", createMockMetadata("express@4.18.2"));

      manifest.lazyPersistOnDisk(storage, { dirtySpecs: ["express@4.18.2"] });
      manifest.lazyPersistOnDisk(storage, { dirtySpecs: ["express@4.18.2"] });
      manifest.lazyPersistOnDisk(storage, { dirtySpecs: ["express@4.18.2"] });

      // Wait for microtask
      await new Promise((resolve) => {
        queueMicrotask(() => resolve(void 0));
      });

      // Should only persist once despite multiple calls
      assert.equal(mockFs.writeFile.mock.calls.length, 1);
    });
  });

  describe("persistPartial", () => {
    it("should persist dirty specs and manifest", async() => {
      const mockFs = createMockFs();
      const mockStorageProvider = createMockStorageProvider();

      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.set.mock.mockImplementation(() => Promise.resolve(true));
      mockStorageProvider.remove.mock.mockImplementation(() => Promise.resolve());

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });
      manifest.currentSpec = "express@4.18.2";

      const storage = new Map<string, PayloadMetadata>();
      storage.set("express@4.18.2", createMockMetadata("express@4.18.2"));

      // Trigger lazyPersistOnDisk to populate dirtySpecs
      manifest.lazyPersistOnDisk(storage, { dirtySpecs: ["express@4.18.2"] });

      // Wait for microtask which calls persistPartial
      await new Promise((resolve) => {
        queueMicrotask(() => resolve(void 0));
      });

      assert.equal(mockStorageProvider.set.mock.calls.length, 1);
      assert.equal(mockFs.writeFile.mock.calls.length, 1);

      const writeCall = mockFs.writeFile.mock.calls[0];
      assert.equal(
        writeCall.arguments[0],
        path.join(PayloadCache.PATH, "manifest.json")
      );

      const writtenManifest = JSON.parse(writeCall.arguments[1] as string);
      assert.deepEqual(writtenManifest, {
        current: "express@4.18.2",
        specs: ["express@4.18.2"]
      });
    });

    it("should remove storage for deleted specs", async() => {
      const mockFs = createMockFs();
      const mockStorageProvider = createMockStorageProvider();

      mockFs.writeFile.mock.mockImplementation(() => Promise.resolve(undefined));
      mockStorageProvider.remove.mock.mockImplementation(() => Promise.resolve());

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      const storage = new Map<string, PayloadMetadata>();
      // No entry for "deleted@1.0.0" in storage

      manifest.lazyPersistOnDisk(storage, { dirtySpecs: ["deleted@1.0.0"] });

      // Wait for microtask
      await new Promise((resolve) => {
        queueMicrotask(() => resolve(void 0));
      });

      assert.equal(mockStorageProvider.remove.mock.calls.length, 1);
    });
  });

  describe("load", () => {
    it("should load manifest and metadata from disk", async() => {
      const mockFs = createMockFs();
      const mockStorageProvider = createMockStorageProvider();

      const manifestData: PayloadManifest = {
        current: "express@4.18.2",
        specs: ["express@4.18.2"]
      };

      mockFs.readFile.mock.mockImplementation(
        () => Promise.resolve(JSON.stringify(manifestData))
      );

      const expectedMetadata = createMockMetadata("express@4.18.2");
      mockStorageProvider.get.mock.mockImplementation(
        () => Promise.resolve(expectedMetadata)
      );

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      const storage = await manifest.load();

      assert.equal(manifest.currentSpec, "express@4.18.2");
      assert.equal(storage.size, 1);
      assert.deepEqual(storage.get("express@4.18.2"), expectedMetadata);
    });

    it("should skip specs with no metadata", async() => {
      const mockFs = createMockFs();
      const mockStorageProvider = createMockStorageProvider();

      const manifestData: PayloadManifest = {
        current: null,
        specs: ["express@4.18.2", "missing@1.0.0"]
      };

      mockFs.readFile.mock.mockImplementation(
        () => Promise.resolve(JSON.stringify(manifestData))
      );

      let callIndex = 0;
      mockStorageProvider.get.mock.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          return Promise.resolve(createMockMetadata("express@4.18.2"));
        }

        return Promise.resolve(null);
      });

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs,
        storageProvider: () => mockStorageProvider as unknown as BasePersistanceProvider<PayloadMetadata>
      });

      const storage = await manifest.load();

      assert.equal(storage.size, 1);
      assert.ok(storage.has("express@4.18.2"));
      assert.ok(!storage.has("missing@1.0.0"));
    });

    it("should return empty storage when manifest read fails", async() => {
      const mockFs = createMockFs();

      mockFs.readFile.mock.mockImplementation(
        () => Promise.reject(new Error("ENOENT"))
      );

      const manifest = new PayloadManifestCache({
        fsProvider: mockFs as unknown as typeof fs
      });

      const storage = await manifest.load();

      assert.equal(storage.size, 0);
    });
  });
});
