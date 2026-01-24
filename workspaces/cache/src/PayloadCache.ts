// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import type { Payload } from "@nodesecure/scanner";
import filenamify from "filenamify";

// Import Internal Dependencies
import {
  type BasePersistanceProvider,
  FilePersistanceProvider
} from "./FilePersistanceProvider.ts";

// CONSTANTS
export type PayloadStorageMap = Map<string, PayloadMetadata>;

export interface PayloadManifest {
  current: string | null;
  specs: string[];
}

export interface PayloadMetadata {
  spec: string;
  scanType: "cwd" | "from";
  locationOnDisk: string;
  lastUsedAt: number;
  integrity: string | null;
}

export interface PayloadSaveOptions {
  /**
   * @default false
   */
  useAsCurrent?: boolean;
  /**
   * @default "cwd"
   */
  scanType?: "cwd" | "from";
}

export interface PayloadCacheOptions {
  fsProvider?: typeof fs;
  storageProvider?: (spec: string) => BasePersistanceProvider<PayloadMetadata>;
}

export class PayloadCache {
  static PATH = path.join(os.homedir(), ".nsecure", "payloads");

  static getPathBySpec(
    spec: string
  ): string {
    return path.join(
      PayloadCache.PATH,
      filenamify(spec)
    );
  }

  static getPathByPayload(
    payload: Payload
  ): string {
    return PayloadCache.getPathBySpec(
      specFromPayload(payload)
    );
  }

  #fsProvider: typeof fs;
  #manifest: PayloadManifestCache;
  #storage = new Map<string, PayloadMetadata>();

  constructor(
    options: PayloadCacheOptions = {}
  ) {
    this.#fsProvider = options.fsProvider || fs;
    this.#manifest = new PayloadManifestCache(options);
  }

  setCurrentSpec(
    spec: string | null
  ): void {
    this.#manifest.currentSpec = spec;
    if (typeof spec === "string") {
      this.updateLastUsedAt(spec);
    }
  }

  getCurrentSpec(): string | null {
    return this.#manifest.currentSpec;
  }

  * [Symbol.iterator](): IterableIterator<PayloadMetadata> {
    yield* [...this.#storage.values()]
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  }

  async findBySpec(
    spec: string
  ): Promise<Payload | null> {
    const filePath = PayloadCache.getPathBySpec(spec);

    try {
      return JSON.parse(
        await this.#fsProvider.readFile(filePath, "utf-8")
      );
    }
    catch {
      return null;
    }
  }

  async findByIntegrity(
    integrity: string
  ): Promise<Payload | null> {
    for (const [spec, metadata] of this.#storage) {
      if (metadata.integrity === integrity) {
        return this.findBySpec(spec);
      }
    }

    return null;
  }

  async remove(
    specOrPayload: string | Payload
  ): Promise<void> {
    const spec = typeof specOrPayload === "string"
      ? specOrPayload
      : specFromPayload(specOrPayload);
    this.#storage.delete(spec);
    if (this.#storage.size === 0) {
      this.setCurrentSpec(null);
    }
    this.#manifest.lazyPersistOnDisk(this.#storage, {
      dirtySpecs: [spec]
    });

    const filePath = typeof specOrPayload === "string"
      ? PayloadCache.getPathBySpec(specOrPayload)
      : PayloadCache.getPathByPayload(specOrPayload);

    await this.#fsProvider.rm(filePath, { force: true });
  }

  async save(
    payload: Payload,
    options: PayloadSaveOptions = {}
  ): Promise<void> {
    const { useAsCurrent = false, scanType = "cwd" } = options;

    const spec = specFromPayload(payload);
    if (useAsCurrent) {
      this.#manifest.currentSpec = spec;
    }

    if (this.#storage.has(spec)) {
      this.updateLastUsedAt(spec);

      return;
    }

    const filePath = PayloadCache.getPathByPayload(payload);

    this.#storage.set(
      spec,
      {
        spec,
        scanType,
        locationOnDisk: filePath,
        lastUsedAt: Date.now(),
        integrity: payload.rootDependency.integrity
      }
    );
    this.#manifest.lazyPersistOnDisk(this.#storage, {
      dirtySpecs: [spec]
    });

    await this.#fsProvider.writeFile(
      filePath,
      JSON.stringify(payload)
    );
  }

  updateLastUsedAt(
    spec: string
  ): void {
    const metadata = this.#storage.get(spec);
    if (metadata) {
      metadata.lastUsedAt = Date.now();
      this.#manifest.lazyPersistOnDisk(
        this.#storage,
        { dirtySpecs: [spec] }
      );
    }
  }

  async load() {
    await this.#manifest.initialize();
    this.#storage = await this.#manifest.load();

    return this;
  }

  async clear() {
    await this.#fsProvider.rm(
      PayloadCache.PATH,
      { recursive: true, force: true }
    );

    return this;
  }
}

export class PayloadManifestCache {
  #pendingStorage: PayloadStorageMap | null = null;
  #pendingPersist = false;
  #dirtySpecs = new Set<string>();
  #fsProvider: typeof fs;
  #storageProvider: (spec: string) => BasePersistanceProvider<PayloadMetadata>;

  currentSpec: string | null = null;

  constructor(
    options: PayloadCacheOptions = {}
  ) {
    const {
      fsProvider = fs,
      storageProvider = (spec: string) => new FilePersistanceProvider<PayloadMetadata>(spec)
    } = options;

    this.#fsProvider = fsProvider;
    this.#storageProvider = storageProvider;
  }

  lazyPersistOnDisk(
    storage: PayloadStorageMap,
    options: { dirtySpecs?: string[]; } = {}
  ) {
    const { dirtySpecs = [] } = options;
    for (const spec of dirtySpecs) {
      this.#dirtySpecs.add(spec);
    }

    this.#pendingStorage = storage;

    if (this.#pendingPersist) {
      return;
    }

    this.#pendingPersist = true;
    queueMicrotask(() => {
      this.#pendingPersist = false;
      if (this.#pendingStorage) {
        this.persistPartial(
          structuredClone(this.#pendingStorage)
        );
        this.#pendingStorage = null;
      }
    });
  }

  async initialize() {
    await this.#fsProvider.mkdir(
      PayloadCache.PATH,
      { recursive: true }
    );

    return this;
  }

  async persistPartial(
    storage: PayloadStorageMap
  ) {
    for (const spec of this.#dirtySpecs) {
      const metadata = storage.get(spec);
      const fileStorage = this.#storageProvider(spec);
      if (metadata) {
        await fileStorage.set(metadata);
      }
      else {
        await fileStorage.remove();
      }
    }
    this.#dirtySpecs.clear();

    await this.#fsProvider.writeFile(
      path.join(PayloadCache.PATH, "manifest.json"),
      JSON.stringify({
        current: this.currentSpec,
        specs: [...storage.keys()]
      })
    );

    return this;
  }

  async load() {
    const storage = new Map<string, PayloadMetadata>();

    try {
      const manifestContent = await this.#fsProvider.readFile(
        path.join(PayloadCache.PATH, "manifest.json"),
        "utf-8"
      );
      const manifest: PayloadManifest = JSON.parse(manifestContent);
      this.currentSpec = manifest.current;

      for (const spec of manifest.specs) {
        const fileStorage = this.#storageProvider(spec);
        const metadata = await fileStorage.get();
        if (metadata) {
          storage.set(spec, metadata);
        }
      }
    }
    catch {
      // No manifest found, skip loading.
    }

    return storage;
  }
}

function specFromPayload(
  payload: Payload
): string {
  return `${payload.rootDependency.name}@${payload.rootDependency.version}`;
}
