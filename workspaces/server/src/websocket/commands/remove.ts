// Import Third-party Dependencies
import type { PayloadsList } from "@nodesecure/cache";

// Import Internal Dependencies
import { context } from "../websocket.als.ts";
import type {
  WebSocketResponse,
  WebSocketContext
} from "../websocket.types.ts";

export async function* remove(
  spec: string
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const ctx = context.getStore()!;

  const cacheList = await ctx.cache.payloadsList();
  let updatedList: PayloadsList;
  if (cacheList.availables.includes(spec)) {
    updatedList = await removeFromAvailables(spec, ctx, cacheList);
  }
  else {
    updatedList = await removeFromMruOrLru(spec, ctx, cacheList);
  }

  yield {
    status: "RELOAD",
    cache: updatedList
  };
}

async function removeFromAvailables(
  spec: string,
  context: WebSocketContext,
  cacheList: PayloadsList
): Promise<PayloadsList> {
  const { cache, logger } = context;
  const { availables, lastUsed, ...rest } = cacheList;

  logger.info("[ws|command.remove] remove from availables");
  const { [spec]: _, ...updatedLastUsed } = lastUsed;
  const updatedList: PayloadsList = {
    ...rest,
    lastUsed: updatedLastUsed,
    availables: availables.filter((iterSpec) => iterSpec !== spec)
  };

  await cache.updatePayloadsList(updatedList);
  cache.removePayload(spec);

  return updatedList;
}

async function removeFromMruOrLru(
  spec: string,
  context: WebSocketContext,
  cacheList: PayloadsList
): Promise<PayloadsList> {
  const { logger, cache } = context;
  const { mru, lru, current } = cacheList;

  logger.debug(`[ws|command.remove](lru: ${lru}|current: ${current})`);
  if (mru.length === 1 && lru.length === 0) {
    throw new Error("Cannot remove the last package.");
  }

  const mruIndex = mru.findIndex((iterSpec) => iterSpec === spec);
  const lruIndex = lru.findIndex((iterSpec) => iterSpec === spec);
  if (mruIndex === -1 && lruIndex === -1) {
    throw new Error("Package not found in cache.");
  }

  const isInMru = mruIndex > -1;
  logger.info(`[ws|command.remove] removing from ${isInMru ? "MRU" : "LRU"}`);
  const updatedList = isInMru ?
    removeFromMru(spec, cacheList) :
    removeFromLru(spec, cacheList);

  await cache.updatePayloadsList(updatedList);
  cache.removePayload(spec);

  return updatedList;
}

function removeFromMru(
  spec: string,
  cacheList: PayloadsList
): PayloadsList {
  const { mru, lru, current, lastUsed, root, availables } = cacheList;

  const updatedMru = mru.filter((iterSpec) => iterSpec !== spec);
  let updatedLru = lru;

  if (lru.length > 0) {
    const sortedLru = [...lru].sort((a, b) => lastUsed[a] - lastUsed[b]);
    const olderLruPkg = sortedLru[0];
    updatedMru.push(olderLruPkg);
    updatedLru = lru.filter((iterSpec) => iterSpec !== olderLruPkg);
  }

  const { [spec]: _, ...updatedLastUsed } = lastUsed;
  const updatedList: PayloadsList = {
    mru: updatedMru,
    lru: updatedLru,
    lastUsed: updatedLastUsed,
    current: current === spec ? updatedMru[0] : current,
    root,
    availables
  };

  return updatedList;
}

function removeFromLru(
  spec: string,
  cacheList: PayloadsList
): PayloadsList {
  const { mru, lru, current, lastUsed, root, availables } = cacheList;

  const { [spec]: _, ...updatedLastUsed } = lastUsed;
  const updatedList: PayloadsList = {
    mru,
    lru: lru.filter((iterSpec) => iterSpec !== spec),
    availables,
    lastUsed: updatedLastUsed,
    current,
    root
  };

  return updatedList;
}
