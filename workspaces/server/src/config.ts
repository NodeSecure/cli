// Import Third-party Dependencies
import { warnings, type WarningName } from "@nodesecure/js-x-ray";
import type { Flag } from "@nodesecure/flags";
import {
  FilePersistanceProvider
} from "@nodesecure/cache";

// Import Internal Dependencies
import { logger } from "./logger.ts";

const experimentalWarnings = Object.entries(warnings)
  .flatMap(([warning, metadata]) => ("experimental" in metadata && metadata.experimental ? [warning] : [])) as WarningName[];

// CONSTANTS
const kDefaultConfig = {
  defaultPackageMenu: "info",
  ignore: {
    flags: [],
    warnings: experimentalWarnings
  },
  disableExternalRequests: false
};

export interface WebUISettings {
  defaultPackageMenu: string;
  ignore: {
    flags: Flag[];
    warnings: WarningName[];
  };
  theme?: "light" | "dark";
  disableExternalRequests: boolean;
}

export function getProvider(): FilePersistanceProvider<WebUISettings> {
  return new FilePersistanceProvider<WebUISettings>(
    "web-ui-settings"
  );
}

export async function get(): Promise<WebUISettings> {
  const cache = getProvider();

  const config = await cache.get();
  logger.info(`[config|get](cache: ${config === null ? "miss" : "hit"})`);
  if (config) {
    logger.info(`[config|get](${JSON.stringify(config)})`);

    return config;
  }

  await setDefault();

  return kDefaultConfig;
}

export async function set(
  newValue: WebUISettings
) {
  logger.info(`[config|set](config: ${JSON.stringify(newValue)})`);

  const cache = getProvider();
  await cache.set(newValue);
}

export async function setDefault() {
  const cache = getProvider();
  await cache.set(kDefaultConfig);
}
