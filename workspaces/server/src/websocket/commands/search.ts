// Import Third-party Dependencies
import * as scanner from "@nodesecure/scanner";
import type { PayloadsList } from "@nodesecure/cache";

// Import Internal Dependencies
import type {
  WebSocketContext,
  WebSocketResponse
} from "../websocket.types.js";

export async function* search(
  spec: string,
  context: WebSocketContext
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { logger, cache } = context;

  const cachedPayload = cache.getPayloadOrNull(spec);
  if (cachedPayload) {
    logger.info("[ws|command.search] one entry found in cache");
    const cacheList = await cache.payloadsList();
    if (cacheList.mru.includes(spec)) {
      logger.info("[ws|command.search] payload is already in the MRU");
      const updatedList: PayloadsList = {
        ...cacheList,
        current: spec,
        lastUsed: { ...cacheList.lastUsed, [spec]: Date.now() }
      };
      await cache.updatePayloadsList(updatedList);
      yield {
        status: "PAYLOAD" as const,
        payload: cachedPayload
      };

      if (cache.startFromZero) {
        yield {
          status: "RELOAD" as const,
          cache: updatedList
        };
        cache.startFromZero = false;
      }

      return;
    }

    const { mru, lru, availables, lastUsed, ...updatedCache } = await cache.removeLastMRU();
    const updatedList: PayloadsList = {
      ...updatedCache,
      mru: [...new Set([...mru, spec])],
      current: spec,
      lru: lru.filter((pckg) => pckg !== spec),
      availables: availables.filter((pckg) => pckg !== spec),
      lastUsed: { ...lastUsed, [spec]: Date.now() }
    };
    await cache.updatePayloadsList(updatedList);

    yield {
      status: "PAYLOAD" as const,
      payload: cachedPayload
    };
    yield {
      status: "RELOAD" as const,
      cache: updatedList
    };

    cache.startFromZero = false;

    return;
  }

  // at this point we don't have the payload in cache so we have to scan it.
  logger.info(`[ws|command.search](scan ${spec} in progress)`);
  yield { status: "SCAN" as const, spec };

  const payload = await scanner.from(spec, { maxDepth: 4 });
  const name = payload.rootDependencyName;
  const version = Object.keys(payload.dependencies[name].versions)[0];

  {
    // save the payload in cache
    const inScanPackageSpec = `${name}@${version}`;
    logger.info(`[ws|command.search](scan ${inScanPackageSpec} done|cache: updated)`);

    // update the payloads list
    const { mru, lru, availables, lastUsed, ...appCache } = await cache.removeLastMRU();
    mru.push(inScanPackageSpec);
    cache.updatePayload(inScanPackageSpec, payload);
    const updatedList: PayloadsList = {
      ...appCache,
      mru: [...new Set(mru)],
      lru,
      availables,
      lastUsed: { ...lastUsed, [inScanPackageSpec]: Date.now() },
      current: inScanPackageSpec
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

    logger.info("[ws|command.search](data sent to client|cache: updated)");
  }
}
