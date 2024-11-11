// Import Third-party Dependencies
import * as Scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import { logger } from "../logger.js";
import { appCache } from "../cache.js";

export async function search(ws, pkg) {
  logger.info(`[WEBSOCKET | SEARCH](pkg: ${pkg})`);

  const cache = await appCache.getPayloadOrNull(pkg);
  if (cache) {
    logger.info(`[WEBSOCKET | SEARCH](payload: ${pkg} found in cache)`);
    const cacheList = await appCache.payloadsList();
    if (cacheList.lru.includes(pkg)) {
      logger.info(`[WEBSOCKET | SEARCH](payload: ${pkg} is already in the LRU)`);
      const updatedList = {
        ...cacheList,
        current: pkg,
        lastUsed: { ...cacheList.lastUsed, [pkg]: Date.now() }
      };
      await appCache.updatePayloadsList(updatedList);
      ws.send(JSON.stringify(cache));

      return;
    }
    const { lru, older, lastUsed, root } = await appCache.removeLastLRU();
    const updatedList = {
      lru: [...new Set([...lru, pkg])],
      current: pkg,
      older: older.filter((pckg) => pckg !== pkg),
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      root
    };
    await appCache.updatePayloadsList(updatedList);

    ws.send(JSON.stringify(cache));
    ws.send(JSON.stringify({
      status: "RELOAD",
      ...updatedList
    }));

    return;
  }

  // at this point we don't have the payload in cache so we have to scan it.
  logger.info(`[WEBSOCKET | SEARCH](scan ${pkg})`);
  ws.send(JSON.stringify({ status: "SCAN", pkg }));

  const payload = await Scanner.from(pkg, { maxDepth: 4 });
  const name = payload.rootDependencyName;
  const version = Object.keys(payload.dependencies[name].versions)[0];

  {
    // save the payload in cache
    const pkg = `${name}@${version}`;
    logger.info(`[WEBSOCKET | SEARCH](scan <${pkg}> done|cache: updated|pkg: ${pkg})`);

    // update the payloads list
    const { lru, older, lastUsed, root } = await appCache.removeLastLRU();
    lru.push(pkg);
    appCache.updatePayload(pkg.replaceAll("/", "-"), payload);
    const updatedList = {
      lru: [...new Set(lru)],
      older,
      lastUsed: { ...lastUsed, [pkg]: Date.now() },
      current: pkg,
      root
    };
    await appCache.updatePayloadsList(updatedList);

    ws.send(JSON.stringify(payload));
    ws.send(JSON.stringify({
      status: "RELOAD",
      ...updatedList
    }));

    logger.info(`[WEBSOCKET | SEARCH](payloadsList updated|payload sent to client)`);
  }
}
