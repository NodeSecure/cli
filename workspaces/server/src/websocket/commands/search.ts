// Import Third-party Dependencies
import * as scanner from "@nodesecure/scanner";
import type { PayloadsList, appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import { context } from "../websocket.als.js";
import type {
  WebSocketResponse
} from "../websocket.types.js";

export async function* search(
  spec: string
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const foundInCache = yield* searchInCache(spec);
  if (foundInCache) {
    return;
  }

  const { logger } = context.getStore()!;
  logger.info("[ws|command.search] scan starting");
  yield {
    status: "SCAN" as const,
    spec
  };

  const payload = await scanner.from(
    spec,
    { maxDepth: 4 }
  );
  logger.info("[ws|command.search] scan completed");

  yield* saveInCache(payload);
}

async function* searchInCache(
  spec: string
): AsyncGenerator<WebSocketResponse, boolean, unknown> {
  const { logger, cache } = context.getStore()!;

  const payload = cache.getPayloadOrNull(spec);
  if (!payload) {
    return false;
  }

  logger.info("[ws|command.search] fetching cache list");
  const cacheList = await cache.payloadsList();

  const isInMru = cacheList.mru.includes(spec);
  logger.info(`[ws|command.search] payload detected in ${isInMru ? "MRU" : "LRU/Availables"}`);

  let cachePayloadList: PayloadsList;
  if (isInMru) {
    cachePayloadList = await handleMruCache(spec, cache, cacheList);
  }
  else {
    cachePayloadList = await handleLruOrAvailableCache(spec, cache);
  }

  yield {
    status: "PAYLOAD" as const,
    payload
  };
  if (!isInMru || cache.startFromZero) {
    yield {
      status: "RELOAD" as const,
      cache: cachePayloadList
    };
  }

  return true;
}

async function handleMruCache(
  spec: string,
  cache: typeof appCache,
  cacheList: PayloadsList
): Promise<PayloadsList> {
  const updatedList: PayloadsList = {
    ...cacheList,
    current: spec,
    lastUsed: { ...cacheList.lastUsed, [spec]: Date.now() }
  };

  await cache.updatePayloadsList(updatedList);

  return updatedList;
}

async function handleLruOrAvailableCache(
  spec: string,
  cache: typeof appCache
): Promise<PayloadsList> {
  const {
    mru, lru, availables, lastUsed,
    ...updatedCache
  } = await cache.removeLastMRU();
  const updatedList: PayloadsList = {
    ...updatedCache,
    mru: [...new Set([...mru, spec])],
    current: spec,
    lru: lru.filter((pckg) => pckg !== spec),
    availables: availables.filter((pckg) => pckg !== spec),
    lastUsed: { ...lastUsed, [spec]: Date.now() }
  };

  await cache.updatePayloadsList(updatedList);
  cache.startFromZero = false;

  return updatedList;
}

async function* saveInCache(
  payload: scanner.Payload
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { logger, cache } = context.getStore()!;

  const name = payload.rootDependencyName;
  const version = Object.keys(payload.dependencies[name].versions)[0];
  const spec = `${name}@${version}`;

  const { mru, lru, availables, lastUsed, ...appCache } = await cache.removeLastMRU();
  mru.push(spec);
  cache.updatePayload(spec, payload);
  const updatedList: PayloadsList = {
    ...appCache,
    mru: [...new Set(mru)],
    lru,
    availables,
    lastUsed: { ...lastUsed, [spec]: Date.now() },
    current: spec
  };
  await cache.updatePayloadsList(updatedList);

  yield {
    status: "PAYLOAD" as const,
    payload
  };
  yield {
    status: "RELOAD" as const,
    cache: updatedList
  };

  cache.startFromZero = false;

  logger.info("[ws|command.search] cache updated");
}
