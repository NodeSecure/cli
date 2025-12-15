// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";

// Import Third-party Dependencies
import cacache from "cacache";

export interface BasePersistanceProvider<T> {
  get(): Promise<T | null>;
  set(value: T): Promise<boolean>;
  remove(): Promise<void>;
}

export class FilePersistanceProvider<T = unknown> implements BasePersistanceProvider<T> {
  static PATH = path.join(os.tmpdir(), "nsecure-cli");

  #cacheKey: string;

  constructor(
    cacheKey: string
  ) {
    this.#cacheKey = cacheKey;
  }

  async get(): Promise<T | null> {
    try {
      const { data } = await cacache.get(
        FilePersistanceProvider.PATH,
        this.#cacheKey
      );

      return JSON.parse(data.toString());
    }
    catch {
      return null;
    }
  }

  async set(
    value: T
  ): Promise<boolean> {
    try {
      await cacache.put(
        FilePersistanceProvider.PATH,
        this.#cacheKey,
        JSON.stringify(value)
      );

      return true;
    }
    catch {
      return false;
    }
  }

  async remove() {
    await cacache.rm(
      FilePersistanceProvider.PATH,
      this.#cacheKey
    );
  }
}
