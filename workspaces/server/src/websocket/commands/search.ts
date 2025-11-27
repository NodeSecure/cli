// Import Third-party Dependencies
import * as scanner from "@nodesecure/scanner";
import type { PayloadsList } from "@nodesecure/cache";

// Import Internal Dependencies
import type {
  WebSocketContext,
  WebSocketResponse
} from "../websocket.types.js";

export async function* search(
  pkg: string,
  context: WebSocketContext
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { logger, cache } = context;
  logger.info(`[ws|search](pkg: ${pkg})`);

  const cachedPayload = cache.getPayloadOrNull(pkg);
  if (cachedPayload) {
    logger.info(`[ws|search](payload: ${pkg} found in cache)`);
    const cacheList = await cache.payloadsList();
    if (cacheList.mru.includes(pkg)) {
      logger.info(`[ws|search](payload: ${pkg} is already in the MRU)`);
      const updatedList: PayloadsList = {
        ...cacheList,
        current: pkg,
        lastUsed: { ...cacheList.lastUsed, [pkg]: Date.now() }
      };
      await cache.updatePayloadsList(updatedList);
      yield cachedPayload;

      if (cache.startFromZero) {
        yield {
          status: "RELOAD" as const,
          ...updatedList
        };
        cache.startFromZero = false;
      }

      return;
    }

    const { mru, lru, availables, lastUsed, ...updatedCache } = await cache.removeLastMRU();
    const updatedList: PayloadsList = {
      ...updatedCache,
      mru: [...new Set([...mru, pkg])],
      current: pkg,
      lru: lru.filter((pckg) => pckg !== pkg),
      availables: availables.filter((pckg) => pckg !== pkg),
      lastUsed: { ...lastUsed, [pkg]: Date.now() }
    };
    await cache.updatePayloadsList(updatedList);

    yield cachedPayload;
    yield {
      status: "RELOAD" as const,
      ...updatedList
    };

    cache.startFromZero = false;

    return;
  }

  // at this point we don't have the payload in cache so we have to scan it.
  logger.info(`[ws|search](scan ${pkg} in progress)`);
  yield { status: "SCAN" as const, pkg };

  const payload = await scanner.from(pkg, { maxDepth: 4 });
  const name = payload.rootDependencyName;
  const version = Object.keys(payload.dependencies[name].versions)[0];

  {
    // save the payload in cache
    const pkg = `${name}@${version}`;
    logger.info(`[ws|search](scan ${pkg} done|cache: updated)`);

    // update the payloads list
    const { mru, lru, availables, lastUsed, ...appCache } = await cache.removeLastMRU();
    mru.push(pkg);
    cache.updatePayload(pkg, payload);
    const updatedList: PayloadsList = {
      ...appCache,
      mru: [...new Set(mru)],
      lru,
      availables,
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      current: pkg
    };
    await cache.updatePayloadsList(updatedList);

    yield payload;
    yield {
      status: "RELOAD" as const,
      ...updatedList
    };

    cache.startFromZero = false;

    logger.info("[ws|search](data sent to client|cache: updated)");
  }
}
