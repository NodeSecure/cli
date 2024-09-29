// Import Internal Dependencies
import { appCache } from "../cache.js";
import { logger } from "../logger.js";

export async function init(socket, lock = false) {
  try {
    const { current, lru, older } = await appCache.payloadsList();
    logger.info(`[WEBSOCKET | INIT](lru: ${lru}|older: ${older}|current: ${current})`);

    if (lru === void 0 || current === void 0) {
      throw new Error("Payloads list not found in cache.");
    }

    socket.send(JSON.stringify({
      status: "INIT",
      current,
      lru,
      older
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
