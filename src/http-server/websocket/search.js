// Import Third-party Dependencies
import * as Scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import { logger } from "../../logger.js";
import { appCache } from "../../cache.js";

export async function search(ws, pkg) {
  logger.info(`[ws|search](pkg: ${pkg})`);

  const cache = await appCache.getPayloadOrNull(pkg);
  if (cache) {
    logger.info(`[ws|search](payload: ${pkg} found in cache)`);
    const cacheList = await appCache.payloadsList();
    if (cacheList.lru.includes(pkg)) {
      logger.info(`[ws|search](payload: ${pkg} is already in the LRU)`);
      const updatedList = {
        ...cacheList,
        current: pkg,
        lastUsed: { ...cacheList.lastUsed, [pkg]: Date.now() }
      };
      await appCache.updatePayloadsList(updatedList);
      ws.send(JSON.stringify(cache));

      if (appCache.startFromZero) {
        ws.send(JSON.stringify({
          status: "RELOAD",
          ...updatedList
        }));
        appCache.startFromZero = false;
      }

      return;
    }

    const { lru, older, lastUsed, ...updatedCache } = await appCache.removeLastLRU();
    const updatedList = {
      ...updatedCache,
      lru: [...new Set([...lru, pkg])],
      current: pkg,
      older: older.filter((pckg) => pckg !== pkg),
      lastUsed: { ...lastUsed, [pkg]: Date.now() }
    };
    await appCache.updatePayloadsList(updatedList);

    ws.send(JSON.stringify(cache));
    ws.send(JSON.stringify({
      status: "RELOAD",
      ...updatedList
    }));

    appCache.startFromZero = false;

    return;
  }

  // at this point we don't have the payload in cache so we have to scan it.
  logger.info(`[ws|search](scan ${pkg} in progress)`);
  ws.send(JSON.stringify({ status: "SCAN", pkg }));

  const payload = await Scanner.from(pkg, { maxDepth: 4 });
  const name = payload.rootDependencyName;
  const version = Object.keys(payload.dependencies[name].versions)[0];

  {
    // save the payload in cache
    const pkg = `${name}@${version}`;
    logger.info(`[ws|search](scan ${pkg} done|cache: updated)`);

    // update the payloads list
    const { lru, older, lastUsed, ...cache } = await appCache.removeLastLRU();
    lru.push(pkg);
    appCache.updatePayload(pkg, payload);
    const updatedList = {
      ...cache,
      lru: [...new Set(lru)],
      older,
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      current: pkg
    };
    await appCache.updatePayloadsList(updatedList);

    ws.send(JSON.stringify(payload));
    ws.send(JSON.stringify({
      status: "RELOAD",
      ...updatedList
    }));

    appCache.startFromZero = false;

    logger.info(`[ws|search](data sent to client|cache: updated)`);
  }
}
