// Import Third-party Dependencies
import type { PayloadsList } from "@nodesecure/cache";

// Import Internal Dependencies
import type {
  WebSocketContext,
  WebSocketResponse
} from "../websocket.types.js";

export async function* remove(
  spec: string,
  context: WebSocketContext
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { cache, logger } = context;

  const { mru, lru, current, lastUsed, root, availables } = await cache.payloadsList();
  delete lastUsed[spec];
  if (availables.includes(spec)) {
    logger.info("[ws|command.remove] remove from availables");
    cache.removePayload(spec);
    const updatedList: PayloadsList = {
      mru,
      current,
      lru,
      lastUsed: {
        ...lastUsed
      },
      root,
      availables: availables.filter((iterSpec) => iterSpec !== spec)
    };
    await cache.updatePayloadsList(updatedList);

    yield {
      status: "RELOAD",
      cache: updatedList
    };

    return;
  }

  logger.debug(`[ws|command.remove](lru: ${lru}|current: ${current})`);

  if (mru.length === 1 && lru.length === 0) {
    throw new Error("Cannot remove the last package.");
  }

  const mruIndex = mru.findIndex((iterSpec) => iterSpec === spec);
  const lruIndex = lru.findIndex((iterSpec) => iterSpec === spec);

  if (mruIndex === -1 && lruIndex === -1) {
    throw new Error("Package not found in cache.");
  }

  if (mruIndex > -1) {
    logger.info("[ws|command.remove] removed from mru");
    const updatedMru = mru.filter((iterSpec) => iterSpec !== spec);
    if (lru.length > 0) {
      // We need to move the first lru package to the mru list
      const olderLruPkg = lru.sort((a, b) => {
        const aDate = lastUsed[a];
        const bDate = lastUsed[b];

        return aDate - bDate;
      });
      updatedMru.push(olderLruPkg[0]);
      lru.splice(lru.indexOf(olderLruPkg[0]), 1);
    }

    const updatedList: PayloadsList = {
      mru: updatedMru,
      lru,
      lastUsed: {
        ...lastUsed
      },
      current: current === spec ? updatedMru[0] : current,
      root,
      availables
    };
    await cache.updatePayloadsList(updatedList);

    yield {
      status: "RELOAD",
      cache: updatedList
    };
  }
  else {
    logger.info("[ws|command.remove] removed from lru");
    const updatedLru = lru.filter((iterSpec) => iterSpec !== spec);
    const updatedList: PayloadsList = {
      mru,
      lru: updatedLru,
      availables,
      lastUsed: {
        ...lastUsed
      },
      current,
      root
    };
    await cache.updatePayloadsList(updatedList);

    yield {
      status: "RELOAD",
      cache: updatedList
    };
  }

  cache.removePayload(spec);
}
