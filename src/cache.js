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
const kSlashReplaceToken = "______";

export const CACHE_PATH = path.join(os.tmpdir(), "nsecure-cli");
export const DEFAULT_PAYLOAD_PATH = path.join(process.cwd(), "nsecure-result.json");

class _AppCache {
  prefix = "";
  startFromZero = false;

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
    if (pkg.includes(kSlashReplaceToken)) {
      throw new Error(`Invalid package name: ${pkg}`);
    }

    fs.writeFileSync(path.join(kPayloadsPath, pkg.replaceAll("/", kSlashReplaceToken)), JSON.stringify(payload));
  }

  getPayload(pkg) {
    try {
      return JSON.parse(fs.readFileSync(path.join(kPayloadsPath, pkg.replaceAll("/", kSlashReplaceToken)), "utf-8"));
    }
    catch (err) {
      logger.error(`[cache|get](pkg: ${pkg}|cache: not found)`);

      throw err;
    }
  }

  availablePayloads() {
    return fs
      .readdirSync(kPayloadsPath)
      .map((filename) => filename.replaceAll(kSlashReplaceToken, "/"));
  }

  getPayloadOrNull(pkg) {
    try {
      return this.getPayload(pkg);
    }
    catch {
      return null;
    }
  }

  async updatePayloadsList(payloadsList) {
    await cacache.put(CACHE_PATH, `${this.prefix}${kPayloadsCache}`, JSON.stringify(payloadsList));
  }

  async payloadsList() {
    try {
      const { data } = await cacache.get(CACHE_PATH, `${this.prefix}${kPayloadsCache}`);

      return JSON.parse(data.toString());
    }
    catch (err) {
      logger.error(`[cache|get](cache: not found)`);

      throw err;
    }
  }

  async #initDefaultPayloadsList() {
    if (this.startFromZero) {
      const payloadsList = {
        mru: [],
        lru: [],
        current: null,
        availables: [],
        lastUsed: {},
        root: null
      };

      logger.info(`[cache|init](startFromZero)`);
      await cacache.put(CACHE_PATH, `${this.prefix}${kPayloadsCache}`, JSON.stringify(payloadsList));

      return;
    }

    const payload = JSON.parse(fs.readFileSync(DEFAULT_PAYLOAD_PATH, "utf-8"));
    const version = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
    const formatted = `${payload.rootDependencyName}@${version}`;
    const payloadsList = {
      mru: [formatted],
      lru: [],
      current: formatted,
      availables: [],
      lastUsed: {
        [formatted]: Date.now()
      },
      root: formatted
    };

    logger.info(`[cache|init](dep: ${formatted}|version: ${version}|rootDependencyName: ${payload.rootDependencyName})`);
    await cacache.put(CACHE_PATH, `${this.prefix}${kPayloadsCache}`, JSON.stringify(payloadsList));
    this.updatePayload(formatted, payload);
  }

  async initPayloadsList(options = {}) {
    const { logging = true } = options;

    try {
      // prevent re-initialization of the cache
      await cacache.get(CACHE_PATH, `${this.prefix}${kPayloadsCache}`);

      return;
    }
    catch {
      // Do nothing.
    }
    const packagesInFolder = this.availablePayloads();
    if (packagesInFolder.length === 0) {
      await this.#initDefaultPayloadsList();

      return;
    }

    if (logging) {
      logger.info(`[cache|init](packagesInFolder: ${packagesInFolder})`);
    }

    await cacache.put(CACHE_PATH, `${this.prefix}${kPayloadsCache}`, JSON.stringify({
      availables: packagesInFolder,
      current: null,
      mru: [],
      lru: []
    }));
  }

  removePayload(pkg) {
    fs.rmSync(path.join(kPayloadsPath, pkg.replaceAll("/", "-")), { force: true });
  }

  async removeLastMRU() {
    const { mru, lastUsed, lru, ...cache } = await this.payloadsList();
    if (mru.length < kMaxPayloads) {
      return {
        ...cache,
        mru,
        lru,
        lastUsed
      };
    }
    const packageToBeRemoved = Object.keys(lastUsed)
      .filter((key) => mru.includes(key))
      .sort((a, b) => lastUsed[a] - lastUsed[b])[0];

    return {
      ...cache,
      mru: mru.filter((pkg) => pkg !== packageToBeRemoved),
      lru: [...lru, packageToBeRemoved],
      lastUsed
    };
  }

  async setRootPayload(payload, options) {
    const { logging = true, local = false } = options;

    const version = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
    const pkg = `${payload.rootDependencyName}@${version}${local ? "#local" : ""}`;
    this.updatePayload(pkg, payload);

    await this.initPayloadsList({ logging });

    const { mru, lru, availables, lastUsed } = await this.removeLastMRU();

    const updatedPayloadsCache = {
      mru: [...new Set([...mru, pkg])],
      lru,
      availables,
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      current: pkg,
      root: pkg
    };
    await this.updatePayloadsList(updatedPayloadsCache);
  }
}

export const appCache = new _AppCache();
