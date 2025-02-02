export async function* remove(
  pkg,
  context
) {
  const { cache, logger } = context;

  const formattedPkg = pkg.replace("/", "-");
  logger.info(`[ws|remove](pkg: ${pkg}|formatted: ${formattedPkg})`);

  try {
    const { mru, lru, current, lastUsed, root, availables } = await cache.payloadsList();
    logger.debug(`[ws|remove](lru: ${lru}|current: ${current})`);

    if (mru.length === 1 && lru.length === 0) {
      throw new Error("Cannot remove the last package.");
    }

    const mruIndex = mru.findIndex((pkgName) => pkgName === pkg);
    const lruIndex = lru.findIndex((pkgName) => pkgName === pkg);

    if (mruIndex === -1 && lruIndex === -1) {
      throw new Error("Package not found in cache.");
    }

    if (mruIndex > -1) {
      logger.info(`[ws|remove](remove from lru)`);
      const updatedMru = mru.filter((pkgName) => pkgName !== pkg);
      if (lru.length > 0) {
        // We need to move the first lru package to the mru list
        const olderLruPkg = lru.sort((a, b) => {
          const aDate = lastUsed[a];
          const bDate = lastUsed[b];

          return aDate - bDate;
        });
        updatedMru.push(olderLruPkg[0]);
        lru.splice(lru.indexOf(olderLruPkg[0]), 1);
      }

      const updatedList = {
        mru: updatedMru,
        lru,
        lastUsed: {
          ...lastUsed,
          [pkg]: void 0
        },
        current: current === pkg ? updatedMru[0] : current,
        root,
        availables
      };
      await cache.updatePayloadsList(updatedList);

      yield {
        status: "RELOAD",
        ...updatedList
      };
    }
    else {
      logger.info(`[ws|remove](remove from lru)`);
      const updatedLru = lru.filter((pkgName) => pkgName !== pkg);
      const updatedList = {
        mru,
        lru: updatedLru,
        availables,
        lastUsed: {
          ...lastUsed,
          [pkg]: void 0
        },
        current,
        root
      };
      await cache.updatePayloadsList(updatedList);

      yield {
        status: "RELOAD",
        ...updatedList
      };
    }

    cache.removePayload(formattedPkg);
  }
  catch (error) {
    logger.error(`[ws|remove](error: ${error.message})`);
    logger.debug(error);

    throw error;
  }
}
