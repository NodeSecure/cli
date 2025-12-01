// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Internal Dependencies
import { context } from "../ALS.ts";
import { logger } from "../logger.ts";
import { cache } from "../cache.ts";
import { send } from "./util/send.ts";

// CONSTANTS
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");

export async function get(
  _req: IncomingMessage,
  res: ServerResponse
) {
  if (cache.startFromZero) {
    logger.info("[data|get](no content)");
    res.statusCode = 204;
    res.end();

    return;
  }

  try {
    const { current, mru } = await cache.payloadsList();
    logger.info(`[data|get](current: ${current})`);
    logger.debug(`[data|get](lru: ${mru})`);

    send(res, cache.getPayload(current));
  }
  catch {
    logger.error("[data|get](No cache yet. Creating one...)");

    const { dataFilePath } = context.getStore()!;

    const payloadPath = dataFilePath || kDefaultPayloadPath;
    const payload = JSON.parse(fs.readFileSync(payloadPath, "utf-8"));

    const { name, version } = payload.rootDependency;
    const formatted = `${name}@${version}${payload.local ? "#local" : ""}`;
    const payloadsList = {
      mru: [formatted],
      current: formatted,
      lru: [],
      availables: cache.availablePayloads().filter((pkg) => pkg !== formatted),
      lastUsed: {
        [formatted]: Date.now()
      },
      root: formatted
    };
    logger.info(`[data|get](dep: ${formatted})`);

    await cache.updatePayloadsList(payloadsList);
    cache.updatePayload(formatted, payload);
    logger.info(`[data|get](cache: created|payloadsList: ${payloadsList.lru})`);

    send(res, payload);
  }
}
