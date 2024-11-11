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
    fs.writeFileSync(path.join(kPayloadsPath, pkg), JSON.stringify(payload));
  }

  async getPayload(pkg) {
    try {
      return JSON.parse(fs.readFileSync(path.join(kPayloadsPath, pkg.replaceAll("/", "-")), "utf-8"));
    }
    catch (err) {
      logger.error(`[CACHE | GET_PAYLOAD](pkg: ${pkg}|cache: not found)`);

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
      logger.error(`[CACHE | PAYLOADS_LIST](cache: not found)`);

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
    // eslint-disable-next-line @stylistic/max-len
    logger.info(`[CACHE | INIT_PAYLOADS_LIST](dep: ${formatted}|version: ${version}|rootDependencyName: ${payload.rootDependencyName})`);
    await cacache.put(CACHE_PATH, kPayloadsCache, JSON.stringify(payloadsList));
    this.updatePayload(formatted.replaceAll("/", "-"), payload);
  }

  async initPayloadsList() {
    const packagesInFolder = fs.readdirSync(kPayloadsPath);
    if (packagesInFolder.length === 0) {
      this.#initDefaultPayloadsList();

      return;
    }

    const list = packagesInFolder.map(({ name }) => name);
    logger.info(`[CACHE | INIT_PAYLOADS_LIST](list: ${list})`);

    await cacache.put(CACHE_PATH, kPayloadsCache, JSON.stringify({ list, current: list[0] }));
  }

  removePayload(pkg) {
    fs.rmSync(path.join(kPayloadsPath, pkg));
  }

  async removeLastLRU() {
    const { lru, lastUsed, older, root } = await this.payloadsList();
    if (lru.length < kMaxPayloads) {
      return { lru, older, lastUsed, root };
    }
    const packageToBeRemoved = Object.keys(lastUsed)
      .filter((key) => lru.includes(key))
      .sort((a, b) => lastUsed[a] - lastUsed[b])[0];

    return {
      lru: lru.filter((pkg) => pkg !== packageToBeRemoved),
      older: [...older, packageToBeRemoved],
      lastUsed,
      root
    };
  }
}

export const appCache = new _AppCache();
