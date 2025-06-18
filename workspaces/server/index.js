// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import polka from "polka";
import { appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import * as root from "./src/endpoints/root.js";
import * as data from "./src/endpoints/data.js";
import * as flags from "./src/endpoints/flags.js";
import * as config from "./src/endpoints/config.js";
import * as search from "./src/endpoints/search.js";
import * as bundle from "./src/endpoints/bundle.js";
import * as npmDownloads from "./src/endpoints/npm-downloads.js";
import * as scorecard from "./src/endpoints/ossf-scorecard.js";
import * as locali18n from "./src/endpoints/i18n.js";
import * as report from "./src/endpoints/report.js";
import * as middlewares from "./src/middlewares/index.js";
import { WebSocketServerInstanciator } from "./src/websocket/index.js";
import { logger } from "./src/logger.js";

export function buildServer(dataFilePath, options) {
  const {
    hotReload = true,
    runFromPayload = true,
    projectRootDir,
    componentsDir
  } = options;

  const httpServer = polka();

  const asyncStoreProperties = {};
  if (runFromPayload) {
    fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);
    asyncStoreProperties.dataFilePath = dataFilePath;
  }
  else {
    appCache.startFromZero = true;
  }
  httpServer.use(
    middlewares.buildContextMiddleware({
      hotReload,
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
  httpServer.get("/scorecard/:org/:pkgName", scorecard.get);
  httpServer.post("/report", report.post);

  return httpServer;
}

export {
  WebSocketServerInstanciator,
  logger
};
