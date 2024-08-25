// Import Internal Dependencies
import { appCache } from "../cache.js";
import { logger } from "../logger.js";

export async function remove(ws, pkg) {
  const formattedPkg = pkg.replace("/", "-");
  logger.info(`[WEBSOCKET | REMOVE](pkg: ${pkg}|formatted: ${formattedPkg})`);

  try {
    const { list, current } = await appCache.payloadsList();
    logger.debug(`[WEBSOCKET | REMOVE](list: ${list}|current: ${current})`);

    if (list.length === 1) {
      throw new Error("Cannot remove the last package.");
    }

    const index = list.findIndex((pkgName) => pkgName === pkg);
    if (index === -1) {
      throw new Error("Package not found in cache.");
    }

    const updatedList = list.filter((pkgName) => pkgName !== pkg);
    const previousCurrent = updatedList.at(0);
    await appCache.updatePayloadsList({
      list: updatedList,
      current: current === pkg ? previousCurrent : current
    });
    appCache.removePayload(formattedPkg.replaceAll("/", "-"));

    logger.info(`[WEBSOCKET | REMOVE](cache: updated|updatedList: ${updatedList}|current: ${previousCurrent})`);

    ws.send(JSON.stringify({
      status: "RELOAD",
      list: updatedList,
      current: current === pkg ? previousCurrent : current
    }));
  }
  catch (e) {
    logger.error(`[WEBSOCKET | REMOVE](error: ${e.message})`);
    logger.debug(e);

    throw e;
  }
}
