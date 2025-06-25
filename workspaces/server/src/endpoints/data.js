// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import send from "@polka/send-type";
import { appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import { logger } from "../logger.js";

// CONSTANTS
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");

export async function get(_req, res) {
  if (appCache.startFromZero) {
    logger.info("[data|get](no content)");
    send(res, 204);

    return;
  }

  try {
    const { current, mru } = await appCache.payloadsList();
    logger.info(`[data|get](current: ${current})`);
    logger.debug(`[data|get](lru: ${mru})`);

    send(res, 200, appCache.getPayload(current));
  }
  catch {
    logger.error("[data|get](No cache yet. Creating one...)");

    const payload = JSON.parse(fs.readFileSync(kDefaultPayloadPath, "utf-8"));
    const version = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
    const formatted = `${payload.rootDependencyName}@${version}${payload.local ? "#local" : ""}`;
    const payloadsList = {
      mru: [formatted],
      current: formatted,
      lru: [],
      availables: appCache.availablePayloads().filter((pkg) => pkg !== formatted),
      lastUsed: {
        [formatted]: Date.now()
      },
      root: formatted
    };
    logger.info(`[data|get](dep: ${formatted}|version: ${version}|rootDependencyName: ${payload.rootDependencyName})`);

    await appCache.updatePayloadsList(payloadsList);
    appCache.updatePayload(formatted, payload);
    logger.info(`[data|get](cache: created|payloadsList: ${payloadsList.lru})`);

    send(res, 200, payload);
  }
}
