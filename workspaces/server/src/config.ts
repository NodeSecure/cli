// Import Third-party Dependencies
import { warnings, type WarningName } from "@nodesecure/js-x-ray";

// Import Internal Dependencies
import { cache, type AppConfig } from "./cache.ts";
import { logger } from "./logger.ts";

const experimentalWarnings = Object.entries(warnings)
  .flatMap(([warning, metadata]) => ("experimental" in metadata && metadata.experimental ? [warning] : [])) as WarningName[];

// CONSTANTS
const kDefaultConfig = {
  defaultPackageMenu: "info",
  ignore: { flags: [], warnings: experimentalWarnings },
  disableExternalRequests: false
};

export async function get(): Promise<AppConfig> {
  try {
    const config = await cache.getConfig();

    const {
      defaultPackageMenu,
      ignore: {
        flags = [],
        warnings = []
      } = {},
      theme,
      disableExternalRequests = false
    } = config;
    logger.info(
      // eslint-disable-next-line @stylistic/max-len
      `[config|get](defaultPackageMenu: ${defaultPackageMenu}|ignore-flag: ${flags}|ignore-warnings: ${warnings}|theme: ${theme}|disableExternalRequests${disableExternalRequests})`
    );

    return {
      defaultPackageMenu,
      ignore: {
        flags,
        warnings
      },
      theme,
      disableExternalRequests
    };
  }
  catch (err: any) {
    logger.error(`[config|get](error: ${err.message})`);

    await cache.updateConfig(kDefaultConfig);

    logger.info(`[config|get](fallback to default: ${JSON.stringify(kDefaultConfig)})`);

    return kDefaultConfig;
  }
}

export async function set(newValue: AppConfig) {
  logger.info(`[config|set](config: ${JSON.stringify(newValue)})`);
  try {
    await cache.updateConfig(newValue);

    logger.info("[config|set](sucess)");
  }
  catch (err: any) {
    logger.error(`[config|set](error: ${err.message})`);

    throw err;
  }
}
