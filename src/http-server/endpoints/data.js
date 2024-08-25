// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import send from "@polka/send-type";

// Import Internal Dependencies
import { appCache } from "../cache.js";
import { logger } from "../logger.js";

// CONSTANTS
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");

export async function get(req, res) {
  try {
    const { current, list } = await appCache.payloadsList();
    logger.info(`[DATA | GET](current: ${current})`);
    logger.debug(`[DATA | GET](list: ${list})`);

    const formatted = current.replaceAll("/", "-");
    send(res, 200, await appCache.getPayload(formatted));
  }
  catch (err) {
    logger.error(`[DATA | GET](No cache yet. Creating one...)`);
    logger.debug(err);

    const payload = JSON.parse(fs.readFileSync(kDefaultPayloadPath, "utf-8"));
    const version = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
    const formatted = `${payload.rootDependencyName}@${version}`;
    const payloadsList = {
      list: [formatted],
      current: formatted
    };
    logger.info(`[DATA | GET](dep: ${formatted}|version: ${version}|rootDependencyName: ${payload.rootDependencyName})`);

    await appCache.updatePayloadsList(payloadsList);
    appCache.updatePayload(formatted.replaceAll("/", "-"), payload);
    logger.info(`[DATA | GET](cache: created|payloadsList: ${payloadsList.list.map(([name]) => name)})`);

    send(res, 200, payload);
  }
}
