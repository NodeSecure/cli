// Import Third-party Dependencies
import * as Scanner from "@nodesecure/scanner";

export async function* search(
  pkg,
  context
) {
  const { logger, cache } = context;
  logger.info(`[ws|search](pkg: ${pkg})`);

  const cachedPayload = cache.getPayloadOrNull(pkg);
  if (cachedPayload) {
    logger.info(`[ws|search](payload: ${pkg} found in cache)`);
    const cacheList = await cache.payloadsList();
    if (cacheList.mru.includes(pkg)) {
      logger.info(`[ws|search](payload: ${pkg} is already in the MRU)`);
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

    const { mru, lru, availables, lastUsed, ...updatedCache } = await cache.removeLastMRU();
    const updatedList = {
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
    const { mru, lru, availables, lastUsed, ...appCache } = await cache.removeLastMRU();
    mru.push(pkg);
    cache.updatePayload(pkg, payload);
    const updatedList = {
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
      status: "RELOAD",
      ...updatedList
    };

    cache.startFromZero = false;

    logger.info("[ws|search](data sent to client|cache: updated)");
  }
}
