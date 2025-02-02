// Import Internal Dependencies
import { appCache } from "../../cache.js";
import { logger } from "../../logger.js";

export async function remove(ws, pkg) {
  const formattedPkg = pkg.replace("/", "-");
  logger.info(`[ws|remove](pkg: ${pkg}|formatted: ${formattedPkg})`);

  try {
    const { lru, older, current, lastUsed, root } = await appCache.payloadsList();
    logger.debug(`[ws|remove](lru: ${lru}|current: ${current})`);

    if (lru.length === 1 && older.length === 0) {
      throw new Error("Cannot remove the last package.");
    }

    const lruIndex = lru.findIndex((pkgName) => pkgName === pkg);
    const olderIndex = older.findIndex((pkgName) => pkgName === pkg);

    if (lruIndex === -1 && olderIndex === -1) {
      throw new Error("Package not found in cache.");
    }

    if (lruIndex > -1) {
      logger.info(`[ws|remove](remove from lru)`);
      const updatedLru = lru.filter((pkgName) => pkgName !== pkg);
      if (older.length > 0) {
        // We need to move the first older package to the lru list
        const olderPkg = older.sort((a, b) => {
          const aDate = lastUsed[a];
          const bDate = lastUsed[b];

          return aDate - bDate;
        });
        updatedLru.push(olderPkg[0]);
        older.splice(older.indexOf(olderPkg[0]), 1);
      }

      const updatedList = {
        lru: updatedLru,
        older,
        lastUsed: {
          ...lastUsed,
          [pkg]: void 0
        },
        current: current === pkg ? updatedLru[0] : current,
        root
      };
      await appCache.updatePayloadsList(updatedList);

      ws.send(JSON.stringify({
        status: "RELOAD",
        ...updatedList
      }));
    }
    else {
      logger.info(`[ws|remove](remove from older)`);
      const updatedOlder = older.filter((pkgName) => pkgName !== pkg);
      const updatedList = {
        lru,
        older: updatedOlder,
        lastUsed: {
          ...lastUsed,
          [pkg]: void 0
        },
        current,
        root
      };
      await appCache.updatePayloadsList(updatedList);

      ws.send(JSON.stringify({
        status: "RELOAD",
        ...updatedList
      }));
    }

    appCache.removePayload(formattedPkg);
  }
  catch (error) {
    logger.error(`[ws|remove](error: ${error.message})`);
    logger.debug(error);

    throw error;
  }
}
