// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

// Import Third-party Dependencies
import sirv from "sirv";

// Import Internal Dependencies
import { getApiRouter } from "./endpoints/index.ts";
import { ViewBuilder } from "./ViewBuilder.class.ts";
import {
  context,
  type AsyncStoreContext,
  type NestedStringRecord
} from "./ALS.ts";
import { cache } from "./cache.ts";

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

export function buildServer(
  dataFilePath: string,
  options: BuildServerOptions
) {
  const {
    hotReload = true,
    runFromPayload = true,
    projectRootDir,
    componentsDir,
    i18n
  } = options;

  const viewBuilder = new ViewBuilder({
    autoReload: hotReload,
    projectRootDir,
    componentsDir
  });
  const store: AsyncStoreContext = {
    i18n,
    viewBuilder
  };
  if (runFromPayload) {
    fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);
    store.dataFilePath = dataFilePath;
  }
  else {
    cache.startFromZero = true;
  }

  const apiRouter = getApiRouter();

  const serving = sirv(
    path.join(projectRootDir, "dist"),
    { dev: true }
  );
  const httpServer = http.createServer((req, res) => {
    context.run(store, () => {
      serving(req, res, () => apiRouter.lookup(req, res));
    });
  });

  return httpServer;
}

export { WebSocketServerInstanciator } from "./websocket/index.ts";
export { logger } from "./logger.ts";

export {
  cache
};
