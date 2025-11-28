// Import Third-party Dependencies
import send from "@polka/send-type";
import * as npm from "@nodesecure/npm-registry-sdk";
import type { Request, Response } from "express-serve-static-core";

// Import Internal Dependencies
import { logger } from "../logger.ts";

export async function get(req: Request, res: Response) {
  const { packageName } = req.params;
  logger.info(`[search|get](packageName: ${packageName}|formatted: ${decodeURIComponent(packageName)})`);

  const { objects, total } = await npm.search({
    text: decodeURIComponent(packageName)
  });
  logger.debug(`[search|get](npmSearchResult: ${JSON.stringify(objects.map((pkg) => pkg.package.name))})`);

  send(res, 200, {
    count: total,
    result: objects.map((pkg) => {
      return {
        name: pkg.package.name,
        version: pkg.package.version,
        description: pkg.package.description
      };
    })
  });
}

export async function versions(req: Request, res: Response) {
  const { packageName } = req.params;

  logger.info(`[search|versions](packageName: ${packageName}|formatted: ${decodeURIComponent(packageName)})`);

  const packument = await npm.packument(decodeURIComponent(packageName));
  const versions = Object.keys(packument.versions);

  logger.info(`[search|versions](packageName: ${packageName}|versions: ${versions})`);
  logger.debug(`[search|versions](packument: ${packument})`);

  send(res, 200, versions);
}
