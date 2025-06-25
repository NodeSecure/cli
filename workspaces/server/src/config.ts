// Import Third-party Dependencies
import { warnings, type WarningName } from "@nodesecure/js-x-ray";
import { appCache, type AppConfig } from "@nodesecure/cache";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { logger } from "./logger.js";

const experimentalWarnings = Object.entries(warnings)
  .flatMap(([warning, metadata]) => ("experimental" in metadata && metadata.experimental ? [warning] : [])) as WarningName[];

// CONSTANTS
const kDefaultConfig = {
  defaultPackageMenu: "info",
  ignore: { flags: [], warnings: experimentalWarnings },
  disableExternalRequests: false
};

export async function get(): Promise<AppConfig> {
  const localLang = await i18n.getLocalLang();
  try {
    const config = await appCache.getConfig();

    const {
      defaultPackageMenu,
      ignore: {
        flags = [],
        warnings = []
      } = {},
      theme,
      disableExternalRequests = false,
      lang = localLang
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
      disableExternalRequests,
      lang
    };
  }
  catch (err: any) {
    logger.error(`[config|get](error: ${err.message})`);

    await appCache.updateConfig(kDefaultConfig);

    logger.info(`[config|get](fallback to default: ${JSON.stringify(kDefaultConfig)})`);

    return { ...kDefaultConfig, lang: localLang };
  }
}

export async function set(newValue: AppConfig) {
  logger.info(`[config|set](config: ${JSON.stringify(newValue)})`);
  try {
    await appCache.updateConfig(newValue);

    logger.info("[config|set](sucess)");
  }
  catch (err: any) {
    logger.error(`[config|set](error: ${err.message})`);

    throw err;
  }

  const i18nLocalLang = await i18n.getLocalLang();
  if (i18nLocalLang !== newValue.lang) {
    logger.info(`[config|set](updating i18n lang to: ${newValue.lang})`);
    await i18n.setLocalLang(newValue.lang!);
    await i18n.getLanguages();
  }
}
