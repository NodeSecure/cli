// Import Node.js Dependencies
import { styleText } from "node:util";

// Import Third-party Dependencies
import prettyJson from "@topcli/pretty-json";
import * as i18n from "@nodesecure/i18n";
import { PayloadCache } from "@nodesecure/cache";
import { config } from "@nodesecure/server";

export async function main(options) {
  const {
    list,
    clear
  } = options;

  await i18n.getLocalLang();

  if (!(list || clear)) {
    console.log(styleText("red", i18n.getTokenSync("cli.commands.cache.missingAction")));
    process.exit(1);
  }

  if (list) {
    await listCache();
  }
  if (clear) {
    await clearCache();
  }
  console.log();
}

async function listCache() {
  const cache = new PayloadCache();
  await cache.load();

  const metadata = Array.from(cache);
  console.log(
    styleText(["underline"], i18n.getTokenSync("cli.commands.cache.cacheTitle"))
  );

  for (const data of metadata) {
    prettyJson(data);
  }
}

async function clearCache() {
  await config.setDefault();

  const cache = new PayloadCache();
  await cache.clear();

  console.log(
    styleText("green", i18n.getTokenSync("cli.commands.cache.cleared"))
  );
}
