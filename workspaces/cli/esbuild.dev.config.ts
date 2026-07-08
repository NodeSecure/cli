// Import Node.js Dependencies
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import chokidar from "chokidar";
import esbuild from "esbuild";
import open from "open";
import {
  WebSocketServerInstanciator,
  logger,
  buildServer
} from "@nodesecure/server";

// Import Internal Dependencies
import english from "./i18n/english.js";
import french from "./i18n/french.js";
import {
  PUBLIC_DIR,
  OUTPUT_DIR,
  getSharedBuildOptions,
  copyStaticAssets
} from "./esbuild.common.ts";

// CONSTANTS
const kComponentsDir = path.join(PUBLIC_DIR, "components");
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");
const kDevPort = Number(process.env.DEV_PORT ?? 8080);

await Promise.all([
  i18n.getLocalLang(),
  i18n.extendFromSystemPath(path.join(import.meta.dirname, "i18n"))
]);

await copyStaticAssets();

const buildContext = await esbuild.context(
  getSharedBuildOptions()
);
await buildContext.watch();

const { hosts: esbuildHosts, port: esbuildPort } = await buildContext.serve({
  servedir: OUTPUT_DIR
});

const dataFilePath = await fs.access(
  kDefaultPayloadPath
).then(() => kDefaultPayloadPath, () => undefined);

const { httpServer, cache, viewBuilder } = await buildServer(dataFilePath, {
  projectRootDir: import.meta.dirname,
  componentsDir: kComponentsDir,
  runFromPayload: dataFilePath !== undefined,
  i18n: {
    english: { ui: english.ui },
    french: { ui: french.ui }
  },
  middleware: (req, res, next) => {
    if (req.url === "/esbuild") {
      const proxyReq = http.request(
        {
          hostname: esbuildHosts[0],
          port: esbuildPort,
          path: req.url,
          method: req.method,
          headers: req.headers
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode!, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on("error", (err) => {
        console.error(`[proxy/esbuild] ${err.message}`);
        res.writeHead(502);
        res.end("Bad Gateway");
      });

      req.pipe(proxyReq);

      return;
    }

    next();
  }
});

const htmlWatcher = chokidar.watch(kComponentsDir, {
  persistent: false,
  awaitWriteFinish: true,
  ignored: (path, stats) => (stats?.isFile() ?? false) && !path.endsWith(".html")
});

htmlWatcher.on("change", async(filePath) => {
  await buildContext.rebuild().catch(console.error);
  viewBuilder.freeCache(filePath);
});

httpServer.listen(kDevPort, () => {
  console.log(`Dev server: http://localhost:${kDevPort}`);
  open(`http://localhost:${kDevPort}`);
});

new WebSocketServerInstanciator({ cache, logger });

console.log("Watching...");
