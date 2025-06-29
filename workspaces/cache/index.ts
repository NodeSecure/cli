// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import { logger } from "@nodesecure/server";
import type { Flag } from "@nodesecure/flags";
import type { WarningName } from "@nodesecure/js-x-ray";
import type { Payload } from "@nodesecure/scanner";

// CONSTANTS
const kConfigCache = "___config";
const kPayloadsCache = "___payloads";
const kPayloadsPath = path.join(os.homedir(), ".nsecure", "payloads");
const kMaxPayloads = 3;
const kSlashReplaceToken = "______";

export const CACHE_PATH = path.join(os.tmpdir(), "nsecure-cli");
export const DEFAULT_PAYLOAD_PATH = path.join(process.cwd(), "nsecure-result.json");

export interface AppConfig {
  defaultPackageMenu: string;
  ignore: {
    flags: Flag[];
    warnings: WarningName[];
  };
  theme?: "light" | "dark";
  disableExternalRequests: boolean;
}

export interface PayloadsList {
  mru: string[];
  lru: string[];
  current: string;
  availables: string[];
  lastUsed: Record<string, number>;
  root: string | null;
}

export interface LoggingOption {
  logging?: boolean;
}

export interface InitPayloadListOptions extends LoggingOption {
  reset?: boolean;
}

export interface SetRootPayloadOptions extends LoggingOption {
  local?: boolean;
}

class _AppCache {
  prefix = "";
  startFromZero = false;

  constructor() {
    fs.mkdirSync(kPayloadsPath, { recursive: true });
  }

  async updateConfig(newValue: AppConfig) {
    await cacache.put(CACHE_PATH, kConfigCache, JSON.stringify(newValue));
  }

  async getConfig(): Promise<AppConfig> {
    const { data } = await cacache.get(CACHE_PATH, kConfigCache);

    return JSON.parse(data.toString());
  }

  updatePayload(packageName: string, payload: Payload) {
    if (packageName.includes(kSlashReplaceToken)) {
      throw new Error(`Invalid package name: ${packageName}`);
    }

    const filePath = path.join(kPayloadsPath, packageName.replaceAll("/", kSlashReplaceToken));
    fs.writeFileSync(filePath, JSON.stringify(payload));
  }

  getPayload(packageName: string): Payload {
    const filePath = path.join(kPayloadsPath, packageName.replaceAll("/", kSlashReplaceToken));

    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    catch (err) {
      logger.error(`[cache|get](pkg: ${packageName}|cache: not found)`);

      throw err;
    }
  }

  availablePayloads() {
    return fs
      .readdirSync(kPayloadsPath)
      .map((filename) => filename.replaceAll(kSlashReplaceToken, "/"));
  }

  getPayloadOrNull(packageName: string): Payload | null {
    try {
      return this.getPayload(packageName);
    }
    catch {
      return null;
    }
  }

  async updatePayloadsList(payloadsList: PayloadsList) {
    await cacache.put(CACHE_PATH, `${this.prefix}${kPayloadsCache}`, JSON.stringify(payloadsList));
  }

  async payloadsList(): Promise<PayloadsList> {
    try {
      const { data } = await cacache.get(CACHE_PATH, `${this.prefix}${kPayloadsCache}`);

      return JSON.parse(data.toString());
    }
    catch (err) {
      logger.error("[cache|get](cache: not found)");

      throw err;
    }
  }

  async #initDefaultPayloadsList(options: LoggingOption = {}) {
    const { logging = true } = options;

    if (this.startFromZero) {
      const payloadsList = {
        mru: [],
        lru: [],
        current: null,
        availables: [],
        lastUsed: {},
        root: null
      };

      if (logging) {
        logger.info("[cache|init](startFromZero)");
      }
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

    if (logging) {
      logger.info(`[cache|init](dep: ${formatted}|version: ${version}|rootDependencyName: ${payload.rootDependencyName})`);
    }
    await cacache.put(CACHE_PATH, `${this.prefix}${kPayloadsCache}`, JSON.stringify(payloadsList));
    this.updatePayload(formatted, payload);
  }

  async initPayloadsList(options: InitPayloadListOptions = {}) {
    const {
      logging = true,
      reset = false
    } = options;

    if (reset) {
      await cacache.rm.all(CACHE_PATH);
    }

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
      await this.#initDefaultPayloadsList({ logging });

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

  removePayload(packageName: string) {
    const filePath = path.join(kPayloadsPath, packageName.replaceAll("/", kSlashReplaceToken));
    fs.rmSync(filePath, { force: true });
  }

  async removeLastMRU(): Promise<PayloadsList> {
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

  async setRootPayload(payload: Payload, options: SetRootPayloadOptions = {}) {
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
