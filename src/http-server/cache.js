// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import { logger } from "./logger.js";

// CONSTANTS
const kConfigCache = "___config";
const kPayloadsCache = "___payloads";
const kPayloadsPath = path.join(os.homedir(), ".nsecure", "payloads");
const kMaxPayloads = 3;

export const CACHE_PATH = path.join(os.tmpdir(), "nsecure-cli");
export const DEFAULT_PAYLOAD_PATH = path.join(process.cwd(), "nsecure-result.json");

class _AppCache {
  constructor() {
    fs.mkdirSync(kPayloadsPath, { recursive: true });
  }

  async updateConfig(newValue) {
    await cacache.put(CACHE_PATH, kConfigCache, JSON.stringify(newValue));
  }

  async getConfig() {
    const { data } = await cacache.get(CACHE_PATH, kConfigCache);

    return JSON.parse(data.toString());
  }

  updatePayload(pkg, payload) {
    fs.writeFileSync(path.join(kPayloadsPath, pkg.replaceAll("/", "-")), JSON.stringify(payload));
  }

  async getPayload(pkg) {
    try {
      return JSON.parse(fs.readFileSync(path.join(kPayloadsPath, pkg.replaceAll("/", "-")), "utf-8"));
    }
    catch (err) {
      logger.error(`[cache|get](pkg: ${pkg}|cache: not found)`);

      throw err;
    }
  }

  async getPayloadOrNull(pkg) {
    try {
      return await this.getPayload(pkg);
    }
    catch {
      return null;
    }
  }

  async updatePayloadsList(payloadsList) {
    await cacache.put(CACHE_PATH, kPayloadsCache, JSON.stringify(payloadsList));
  }

  async payloadsList() {
    try {
      const { data } = await cacache.get(CACHE_PATH, kPayloadsCache);

      return JSON.parse(data.toString());
    }
    catch (err) {
      logger.error(`[cache|get](cache: not found)`);

      throw err;
    }
  }

  async #initDefaultPayloadsList() {
    const payload = JSON.parse(fs.readFileSync(DEFAULT_PAYLOAD_PATH, "utf-8"));
    const version = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
    const formatted = `${payload.rootDependencyName}@${version}`;
    const payloadsList = {
      lru: [formatted],
      current: formatted,
      older: [],
      lastUsed: {
        [formatted]: Date.now()
      },
      root: formatted
    };

    logger.info(`[cache|init](dep: ${formatted}|version: ${version}|rootDependencyName: ${payload.rootDependencyName})`);
    await cacache.put(CACHE_PATH, kPayloadsCache, JSON.stringify(payloadsList));
    this.updatePayload(formatted, payload);
  }

  async initPayloadsList(options = {}) {
    const { logging = true } = options;

    try {
      // prevent re-initialization of the cache
      await cacache.get(CACHE_PATH, kPayloadsCache);

      return;
    }
    catch {
      // Do nothing.
    }
    const packagesInFolder = fs.readdirSync(kPayloadsPath);
    if (packagesInFolder.length === 0) {
      await this.#initDefaultPayloadsList();

      return;
    }

    if (logging) {
      logger.info(`[cache|init](packagesInFolder: ${packagesInFolder})`);
    }

    await cacache.put(CACHE_PATH, kPayloadsCache, JSON.stringify({
      older: packagesInFolder,
      current: null,
      lru: []
    }));
  }

  removePayload(pkg) {
    fs.rmSync(path.join(kPayloadsPath, pkg.replaceAll("/", "-")), { force: true });
  }

  async removeLastLRU() {
    const { lru, lastUsed, older, ...cache } = await this.payloadsList();
    if (lru.length < kMaxPayloads) {
      return {
        ...cache,
        lru,
        older,
        lastUsed
      };
    }
    const packageToBeRemoved = Object.keys(lastUsed)
      .filter((key) => lru.includes(key))
      .sort((a, b) => lastUsed[a] - lastUsed[b])[0];

    return {
      ...cache,
      lru: lru.filter((pkg) => pkg !== packageToBeRemoved),
      older: [...older, packageToBeRemoved],
      lastUsed
    };
  }

  async setRootPayload(payload, options) {
    const { logging = true, local = false } = options;

    const version = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
    const pkg = `${payload.rootDependencyName}@${version}${local ? "#local" : ""}`;
    this.updatePayload(pkg, payload);

    await this.initPayloadsList({ logging });

    const { lru, older, lastUsed } = await this.removeLastLRU();

    const updatedPayloadsCache = {
      lru: [...new Set([...lru, pkg])],
      older,
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      current: pkg,
      root: pkg
    };
    await this.updatePayloadsList(updatedPayloadsCache);
  }
}

export const appCache = new _AppCache();
