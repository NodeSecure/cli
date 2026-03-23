// Import Node.js Dependencies
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";

// Import Third-party Dependencies
import sirv from "sirv";
import { PayloadCache } from "@nodesecure/cache";
import type { Payload } from "@nodesecure/scanner";

// Import Internal Dependencies
import { getApiRouter } from "./endpoints/index.ts";
import { ViewBuilder } from "./ViewBuilder.class.ts";
import {
  context,
  type AsyncStoreContext,
  type NestedStringRecord
} from "./ALS.ts";

export interface BuildServerOptions {
  hotReload?: boolean;
  runFromPayload?: boolean;
  scanType?: "cwd" | "from";
  projectRootDir: string;
  componentsDir: string;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
}

export async function buildServer(
  dataFilePath: string,
  options: BuildServerOptions
): Promise<{
  httpServer: http.Server;
  cache: PayloadCache;
}> {
  const {
    runFromPayload = true,
    scanType = "from",
    projectRootDir,
    componentsDir,
    i18n
  } = options;
  const cache = await new PayloadCache().load();

  const viewBuilder = new ViewBuilder({
    projectRootDir,
    componentsDir
  });
  const store: AsyncStoreContext = {
    i18n,
    viewBuilder,
    cache
  };
  if (runFromPayload) {
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
      serving(req, res, () => apiRouter.lookup(req, res));
    });
  });

  return {
    httpServer,
    cache
  };
}

export { WebSocketServerInstanciator } from "./websocket/index.ts";
export { logger } from "./logger.ts";
export { getApiRouter } from "./endpoints/index.ts";
export { ViewBuilder } from "./ViewBuilder.class.ts";
export { context, type AsyncStoreContext } from "./ALS.ts";
export * as config from "./config.ts";
