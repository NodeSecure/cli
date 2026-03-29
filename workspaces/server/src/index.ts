// Import Node.js Dependencies
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";

// Import Third-party Dependencies
import sirv from "sirv";
import { PayloadCache } from "@nodesecure/cache";
import type { Payload } from "@nodesecure/scanner";
import type { report } from "@nodesecure/report";

// Import Internal Dependencies
import { getApiRouter } from "./endpoints/index.ts";
import { ViewBuilder } from "./ViewBuilder.class.ts";
import {
  context,
  type AsyncStoreContext,
  type NestedStringRecord
} from "./ALS.ts";

// CONSTANTS
export const DEFAULT_WS_PORT = 1338;

export interface BuildServerOptions {
  hotReload?: boolean;
  runFromPayload?: boolean;
  scanType?: "cwd" | "from";
  projectRootDir: string;
  componentsDir: string;
  wsPort?: number;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
  middleware?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => void
  ) => void;
  reporter?: typeof report;
}

export async function buildServer(
  dataFilePath: string | undefined,
  options: BuildServerOptions
): Promise<{
  httpServer: http.Server;
  cache: PayloadCache;
  viewBuilder: ViewBuilder;
}> {
  const {
    runFromPayload = true,
    scanType = "from",
    projectRootDir,
    componentsDir,
    wsPort = DEFAULT_WS_PORT,
    i18n,
    reporter
  } = options;
  const cache = await new PayloadCache().load();

  const viewBuilder = new ViewBuilder({
    projectRootDir,
    componentsDir
  });
  const store: AsyncStoreContext = {
    i18n,
    viewBuilder,
    wsPort,
    cache,
    reporter
  };
  if (runFromPayload && dataFilePath !== undefined) {
    const payloadStr = await fs.readFile(dataFilePath, "utf-8");
    const payload = JSON.parse(payloadStr) as Payload;

    await cache.save(payload, {
      useAsCurrent: true,
      scanType
    });
  }
  else {
    cache.setCurrentSpec(null);
  }

  const apiRouter = getApiRouter();

  const serving = sirv(
    path.join(projectRootDir, "dist"),
    { dev: true }
  );
  const httpServer = http.createServer((req, res) => {
    context.run(store, () => {
      function serve() {
        serving(req, res, () => apiRouter.lookup(req, res));
      }
      if (options.middleware) {
        options.middleware(req, res, serve);
      }
      else {
        serve();
      }
    });
  });

  return {
    httpServer,
    cache,
    viewBuilder
  };
}

export { WebSocketServerInstanciator } from "./websocket/index.ts";
export { logger } from "./logger.ts";
export { getApiRouter } from "./endpoints/index.ts";
export { ViewBuilder } from "./ViewBuilder.class.ts";
export { context, type AsyncStoreContext } from "./ALS.ts";
export * as config from "./config.ts";
