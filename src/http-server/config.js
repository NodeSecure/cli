// Import Internal Dependencies
import { appCache } from "./cache.js";
import { logger } from "./logger.js";

// CONSTANTS
const kDefaultConfig = {
  defaultPackageMenu: "info",
  ignore: { flags: [], warnings: [] }
};

export async function get() {
  try {
    const config = await appCache.getConfig();

    logger.info(`[CONFIG | GET](config: ${config})`);

    return config;
  }
  catch (err) {
    logger.error(`[CONFIG | GET](error: ${err.message})`);

    await appCache.updateConfig(kDefaultConfig);

    logger.info(`[CONFIG | GET](fallback to default: ${JSON.stringify(kDefaultConfig)})`);

    return kDefaultConfig;
  }
}

export async function set(newValue) {
  logger.info(`[CONFIG | SET](config: ${newValue})`);
  try {
    await appCache.updateConfig(newValue);

    logger.info(`[CONFIG | SET](sucess)`);
  }
  catch (err) {
    logger.error(`[CONFIG | SET](error: ${err.message})`);

    throw err;
  }
}
