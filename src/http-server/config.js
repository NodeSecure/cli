// Import Internal Dependencies
import { appCache } from "../cache.js";
import { logger } from "../logger.js";

// CONSTANTS
const kDefaultConfig = {
  defaultPackageMenu: "info",
  ignore: { flags: [], warnings: [] }
};

export async function get() {
  try {
    const config = await appCache.getConfig();

    const {
      defaultPackageMenu,
      ignore: {
        flags,
        warnings
      } = {}
    } = config;
    logger.info(`[config|get](defaultPackageMenu: ${defaultPackageMenu}|ignore-flag: ${flags}|ignore-warnings: ${warnings})`);

    return config;
  }
  catch (err) {
    logger.error(`[config|get](error: ${err.message})`);

    await appCache.updateConfig(kDefaultConfig);

    logger.info(`[config|get](fallback to default: ${JSON.stringify(kDefaultConfig)})`);

    return kDefaultConfig;
  }
}

export async function set(newValue) {
  logger.info(`[config|set](config: ${newValue})`);
  try {
    await appCache.updateConfig(newValue);

    logger.info("[config|set](sucess)");
  }
  catch (err) {
    logger.error(`[config|set](error: ${err.message})`);

    throw err;
  }
}
