// Import Node.js Dependencies
import { styleText } from "node:util";
import { setImmediate } from "node:timers/promises";

// Import Third-party Dependencies
import prettyJson from "@topcli/pretty-json";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { appCache } from "../cache.js";

export async function main(options) {
  const {
    list,
    clear,
    full
  } = options;

  await i18n.getLocalLang();

  if (!(list || clear)) {
    console.log(styleText("red", i18n.getTokenSync("cli.commands.cache.missingAction")));
    process.exit(1);
  }

  if (list) {
    listCache(full);
  }
  if (clear) {
    await setImmediate();
    await clearCache(full);
  }
}

async function listCache(full) {
  const paylodsList = await appCache.payloadsList();
  console.log(styleText(["underline"], i18n.getTokenSync("cli.commands.cache.cacheTitle")));
  prettyJson(paylodsList);

  if (full) {
    console.log(styleText(["underline"], i18n.getTokenSync("cli.commands.cache.scannedPayloadsTitle")));
    try {
      const payloads = appCache.availablePayloads();
      prettyJson(payloads);
    }
    catch {
      prettyJson([]);
    }
  }
}

async function clearCache(full) {
  if (full) {
    appCache.availablePayloads().forEach((pkg) => {
      appCache.removePayload(pkg);
    });
  }

  await appCache.initPayloadsList({ logging: false, reset: true });

  console.log(styleText("green", i18n.getTokenSync("cli.commands.cache.cleared")));
}
