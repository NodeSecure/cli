// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import polka from "polka";

// Import Internal Dependencies
import * as root from "./endpoints/root.ts";
import * as data from "./endpoints/data.ts";
import * as flags from "./endpoints/flags.ts";
import * as config from "./endpoints/config.ts";
import * as search from "./endpoints/search.ts";
import * as bundle from "./endpoints/bundle.ts";
import * as npmDownloads from "./endpoints/npm-downloads.ts";
import * as scorecard from "./endpoints/ossf-scorecard.ts";
import * as locali18n from "./endpoints/i18n.ts";
import * as report from "./endpoints/report.ts";
import * as middlewares from "./middlewares/index.ts";
import { type BuildContextMiddlewareOptions } from "./middlewares/context.ts";
import { WebSocketServerInstanciator } from "./websocket/index.ts";
import { logger } from "./logger.ts";
import { cache } from "./cache.ts";

export type NestedStringRecord = {
  [key: string]: string | NestedStringRecord;
};

export interface BuildServerOptions {
  hotReload?: boolean;
  runFromPayload?: boolean;
  projectRootDir: string;
  componentsDir: string;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
}

export function buildServer(dataFilePath: string, options: BuildServerOptions) {
  const {
    hotReload = true,
    runFromPayload = true,
    projectRootDir,
    componentsDir,
    i18n
  } = options;

  const httpServer = polka();

  const asyncStoreProperties: BuildContextMiddlewareOptions["storeProperties"] = {
    i18n
  };
  if (runFromPayload) {
    fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);
    asyncStoreProperties.dataFilePath = dataFilePath;
  }
  else {
    cache.startFromZero = true;
  }
  httpServer.use(
    middlewares.buildContextMiddleware({
      autoReload: hotReload,
      storeProperties: asyncStoreProperties,
      projectRootDir,
      componentsDir
    })
  );

  httpServer.use(middlewares.addStaticFiles({ projectRootDir }));
  httpServer.get("/", root.get);

  httpServer.get("/data", data.get);
  httpServer.get("/config", config.get);
  httpServer.put("/config", config.save);
  httpServer.get("/i18n", locali18n.get);

  httpServer.get("/search/:packageName", search.get);
  httpServer.get("/search-versions/:packageName", search.versions);

  httpServer.get("/flags", flags.getAll);
  httpServer.get("/flags/description/:title", flags.get);
  httpServer.get("/bundle/:pkgName", bundle.get);
  httpServer.get("/bundle/:pkgName/:version", bundle.get);
  httpServer.get("/downloads/:pkgName", npmDownloads.get);
  // @ts-ignore
  httpServer.get("/scorecard/:org/:pkgName", scorecard.get);
  httpServer.post("/report", report.post);

  return httpServer;
}

export {
  WebSocketServerInstanciator,
  logger,
  cache
};
