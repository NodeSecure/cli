// Import Internal Dependencies
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// Import Internal Dependencies
import { appCache } from "../cache.js";
import { logger } from "../logger.js";

export async function init(socket, lock = false) {
  try {
    const { list, current } = await appCache.payloadsList();
    logger.info(`[WEBSOCKET | INIT](list: ${list}|current: ${current})`);

    if (list === void 0 || current === void 0) {
      throw new Error("Payloads list not found in cache.");
    }

    socket.send(JSON.stringify({
      status: "INIT",
      list,
      current: list.find((name) => name === current)
    }));
  }
  catch (e) {
    logger.error(`[WEBSOCKET | INIT](No cache yet. Creating one...)`);
    logger.debug(e);

    if (lock) {
      return;
    }

    await appCache.initPayloadsList();

    init(socket, true);
  }
}
