// Import Third-party Dependencies
import * as Scanner from "@nodesecure/scanner";

export async function* search(
  pkg,
  context
) {
  const { logger, cache } = context;
  logger.info(`[ws|search](pkg: ${pkg})`);

  const cachedPayload = await cache.getPayloadOrNull(pkg);
  if (cachedPayload) {
    logger.info(`[ws|search](payload: ${pkg} found in cache)`);
    const cacheList = await cache.payloadsList();
    if (cacheList.lru.includes(pkg)) {
      logger.info(`[ws|search](payload: ${pkg} is already in the LRU)`);
      const updatedList = {
        ...cacheList,
        current: pkg,
        lastUsed: { ...cacheList.lastUsed, [pkg]: Date.now() }
      };
      await cache.updatePayloadsList(updatedList);
      yield cachedPayload;

      if (cache.startFromZero) {
        yield {
          status: "RELOAD",
          ...updatedList
        };
        cache.startFromZero = false;
      }

      return;
    }

    const { lru, older, lastUsed, ...updatedCache } = await cache.removeLastLRU();
    const updatedList = {
      ...updatedCache,
      lru: [...new Set([...lru, pkg])],
      current: pkg,
      older: older.filter((pckg) => pckg !== pkg),
      lastUsed: { ...lastUsed, [pkg]: Date.now() }
    };
    await cache.updatePayloadsList(updatedList);

    yield cachedPayload;
    yield {
      status: "RELOAD",
      ...updatedList
    };

    cache.startFromZero = false;

    return;
  }

  // at this point we don't have the payload in cache so we have to scan it.
  logger.info(`[ws|search](scan ${pkg} in progress)`);
  yield { status: "SCAN", pkg };

  const payload = await Scanner.from(pkg, { maxDepth: 4 });
  const name = payload.rootDependencyName;
  const version = Object.keys(payload.dependencies[name].versions)[0];

  {
    // save the payload in cache
    const pkg = `${name}@${version}`;
    logger.info(`[ws|search](scan ${pkg} done|cache: updated)`);

    // update the payloads list
    const { lru, older, lastUsed, ...LRUCache } = await cache.removeLastLRU();
    lru.push(pkg);
    cache.updatePayload(pkg, payload);
    const updatedList = {
      ...LRUCache,
      lru: [...new Set(lru)],
      older,
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      current: pkg
    };
    await cache.updatePayloadsList(updatedList);

    yield payload;
    yield {
      status: "RELOAD",
      ...updatedList
    };

    cache.startFromZero = false;

    logger.info(`[ws|search](data sent to client|cache: updated)`);
  }
}
