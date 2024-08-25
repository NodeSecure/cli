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
    logger.debug(`[WEBSOCKET | SEARCH](cache: ${cache}`);

    const { list, current } = await appCache.payloadsList();
    logger.debug(`[WEBSOCKET | SEARCH](list: ${list}|current:${current})`);
    {
      const payload = list.find((pckg) => pckg === pkg);
      if (payload === void 0) {
        logger.info(`[WEBSOCKET | SEARCH](add ${pkg})`);
        list.push(pkg);

        await appCache.updatePayloadsList({ list, current: pkg });
        ws.send(JSON.stringify(cache));

        logger.info(`[WEBSOCKET | SEARCH](payload sent to client)`);

        return;
      }
    }
    logger.info(`[WEBSOCKET | SEARCH](payload already exists)`);

    await appCache.updatePayloadsList({ list, current: pkg });
    ws.send(JSON.stringify(cache));

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
    const { list } = await appCache.payloadsList();
    list.push(pkg);
    appCache.updatePayload(pkg.replaceAll("/", "-"), payload);
    await appCache.updatePayloadsList({ list, current: pkg });

    ws.send(JSON.stringify(payload));
    ws.send(JSON.stringify({
      status: "RELOAD",
      list,
      current: pkg
    }));

    logger.info(`[WEBSOCKET | SEARCH](payloadsList updated|payload sent to client)`);
  }
}
