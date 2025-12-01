// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import * as npm from "@nodesecure/npm-registry-sdk";

// Import Internal Dependencies
import { logger } from "../logger.ts";
import { send } from "./util/send.ts";

export async function get(
  _: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string | undefined>
) {
  const { packageName } = params;
  if (!packageName) {
    send(res, {
      error: "Package name is missing."
    }, { code: 400 });

    return;
  }

  logger.info(`[search|get](packageName: ${packageName}|formatted: ${decodeURIComponent(packageName)})`);

  const { objects, total } = await npm.search({
    text: decodeURIComponent(packageName)
  });
  logger.debug(`[search|get](npmSearchResult: ${JSON.stringify(objects.map((pkg) => pkg.package.name))})`);

  send(res, {
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

export async function versions(
  _: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string | undefined>
) {
  const { packageName } = params;
  if (!packageName) {
    send(res, {
      error: "Package name is missing."
    }, { code: 400 });

    return;
  }

  logger.info(`[search|versions](packageName: ${packageName}|formatted: ${decodeURIComponent(packageName)})`);

  const packument = await npm.packument(decodeURIComponent(packageName));
  const versions = Object.keys(packument.versions);

  logger.info(`[search|versions](packageName: ${packageName}|versions: ${versions})`);
  logger.debug(`[search|versions](packument: ${packument})`);

  send(res, versions);
}
