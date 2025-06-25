// Import Third-party Dependencies
import { warnings } from "@nodesecure/js-x-ray";
import { appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import { logger } from "./logger.js";

const experimentalWarnings = Object.entries(warnings)
  .flatMap(([warning, { experimental }]) => (experimental ? [warning] : []));

// CONSTANTS
const kDefaultConfig = {
  defaultPackageMenu: "info",
  ignore: { flags: [], warnings: experimentalWarnings },
  disableExternalRequests: false
};

export async function get() {
  try {
    const config = await appCache.getConfig();

    const {
      defaultPackageMenu,
      ignore: {
        flags,
        warnings
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
  catch (err) {
    logger.error(`[config|get](error: ${err.message})`);

    await appCache.updateConfig(kDefaultConfig);

    logger.info(`[config|get](fallback to default: ${JSON.stringify(kDefaultConfig)})`);

    return kDefaultConfig;
  }
}

export async function set(newValue) {
  logger.info(`[config|set](config: ${JSON.stringify(newValue)})`);
  try {
    await appCache.updateConfig(newValue);

    logger.info("[config|set](sucess)");
  }
  catch (err) {
    logger.error(`[config|set](error: ${err.message})`);

    throw err;
  }
}
