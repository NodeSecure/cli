// Import Node.js Dependencies
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import { getBuildConfiguration } from "@nodesecure/documentation-ui/node";
import * as i18n from "@nodesecure/i18n";
import esbuild from "esbuild";
import router from "find-my-way";
import open from "open";
import sirv from "sirv";

// Import Internal Dependencies
import english from "./i18n/english.js";
import french from "./i18n/french.js";
import { context as alsContext } from "./workspaces/server/src/ALS.ts";
import { ViewBuilder } from "./workspaces/server/src/ViewBuilder.class.ts";
import { cache } from "./workspaces/server/src/cache.ts";
import * as bundle from "./workspaces/server/src/endpoints/bundle.ts";
import * as config from "./workspaces/server/src/endpoints/config.ts";
import * as data from "./workspaces/server/src/endpoints/data.ts";
import * as flags from "./workspaces/server/src/endpoints/flags.ts";
import * as locali18n from "./workspaces/server/src/endpoints/i18n.ts";
import * as npmDownloads from "./workspaces/server/src/endpoints/npm-downloads.ts";
import * as scorecard from "./workspaces/server/src/endpoints/ossf-scorecard.ts";
import * as report from "./workspaces/server/src/endpoints/report.ts";
import * as root from "./workspaces/server/src/endpoints/root.ts";
import * as search from "./workspaces/server/src/endpoints/search.ts";
import { logger } from "./workspaces/server/src/logger.ts";
import { WebSocketServerInstanciator } from "./workspaces/server/src/websocket/index.ts";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const kPublicDir = path.join(__dirname, "public");
const kOutDir = path.join(__dirname, "dist");
const kImagesDir = path.join(kPublicDir, "img");
const kNodeModulesDir = path.join(__dirname, "node_modules");
const kComponentsDir = path.join(kPublicDir, "components");
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");

const kDevPort = Number(process.env.DEV_PORT ?? 8080);

await i18n.getLocalLang();
await i18n.extendFromSystemPath(path.join(__dirname, "i18n"));

const imagesFiles = await fsAsync.readdir(kImagesDir);

await Promise.all([
  ...imagesFiles
    .map((name) => fsAsync.copyFile(path.join(kImagesDir, name), path.join(kOutDir, name))),
  fsAsync.copyFile(path.join(kPublicDir, "favicon.ico"), path.join(kOutDir, "favicon.ico"))
]);

const buildContext = await esbuild.context({
  entryPoints: [
    path.join(kPublicDir, "main.js"),
    path.join(kPublicDir, "main.css"),
    path.join(kNodeModulesDir, "highlight.js", "styles", "github.css"),
    ...getBuildConfiguration().entryPoints
  ],

  loader: {
    ".jpg": "file",
    ".png": "file",
    ".woff": "file",
    ".woff2": "file",
    ".eot": "file",
    ".ttf": "file",
    ".svg": "file"
  },
  platform: "browser",
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  outdir: kOutDir
});

await buildContext.watch();

const { hosts: esbuildHosts, port: esbuildPort } = await buildContext.serve({
  servedir: kOutDir
});

const dataFilePath = fs.existsSync(kDefaultPayloadPath) ? kDefaultPayloadPath : undefined;

if (dataFilePath === undefined) {
  cache.startFromZero = true;
}

const store = {
  i18n: { english: { ui: english.ui }, french: { ui: french.ui } },
  viewBuilder: new ViewBuilder({
    autoReload: true,
    projectRootDir: __dirname,
    componentsDir: kComponentsDir
  }),
  dataFilePath
};

const serving = sirv(kOutDir, { dev: true });

const apiRouter = router({
  ignoreTrailingSlash: true,
  defaultRoute: (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url === "/esbuild") {
      const proxyReq = http.request(
        { hostname: esbuildHosts[0], port: esbuildPort, path: req.url, method: req.method, headers: req.headers },
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

    serving(req, res, () => {
      res.writeHead(404);
      res.end("Not Found");
    });
  }
});

// same as workspaces/server/src/endpoints/index.ts ---
apiRouter.get("/", root.get);
apiRouter.get("/data", data.get);
apiRouter.get("/config", config.get);
apiRouter.put("/config", config.save);
apiRouter.get("/i18n", locali18n.get);
apiRouter.get("/search/:packageName", search.get);
apiRouter.get("/search-versions/:packageName", search.versions);
apiRouter.get("/flags", flags.getAll);
apiRouter.get("/flags/description/:title", flags.get);
apiRouter.get("/bundle/:packageName", bundle.get);
apiRouter.get("/bundle/:packageName/:version", bundle.get);
apiRouter.get("/downloads/:packageName", npmDownloads.get);
apiRouter.get("/scorecard/:org/:packageName", scorecard.get);
apiRouter.post("/report", report.post);

http.createServer((req, res) => alsContext.run(store, () => apiRouter.lookup(req, res)))
  .listen(kDevPort, () => {
    console.log(`Dev server: http://localhost:${kDevPort}`);
    open(`http://localhost:${kDevPort}`);
  });

new WebSocketServerInstanciator({ cache, logger });

console.log("Watching...");
