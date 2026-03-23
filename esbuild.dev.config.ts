// Import Node.js Dependencies
import fsAsync from "node:fs/promises";
import http from "node:http";
import path from "node:path";

// Import Third-party Dependencies
import {
  getBuildConfiguration
} from "@nodesecure/documentation-ui/node";
import * as i18n from "@nodesecure/i18n";
import chokidar from "chokidar";
import esbuild from "esbuild";
import open from "open";
import sirv from "sirv";
import { PayloadCache } from "@nodesecure/cache";
import {
  WebSocketServerInstanciator,
  logger,
  ViewBuilder,
  getApiRouter,
  context as als, type AsyncStoreContext
} from "@nodesecure/server";

// Import Internal Dependencies
import english from "./i18n/english.js";
import french from "./i18n/french.js";

// CONSTANTS
const kPublicDir = path.join(import.meta.dirname, "public");
const kOutDir = path.join(import.meta.dirname, "dist");
const kImagesDir = path.join(kPublicDir, "img");
const kNodeModulesDir = path.join(import.meta.dirname, "node_modules");
const kComponentsDir = path.join(kPublicDir, "components");
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");
const kDevPort = Number(process.env.DEV_PORT ?? 8080);

await Promise.all([
  i18n.getLocalLang(),
  i18n.extendFromSystemPath(path.join(import.meta.dirname, "i18n"))
]);

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

const dataFilePath = await fsAsync.access(
  kDefaultPayloadPath
).then(() => kDefaultPayloadPath, () => undefined);
const cache = await new PayloadCache().load();

if (dataFilePath === undefined) {
  cache.setCurrentSpec(null);
}
else {
  const payloadStr = await fsAsync.readFile(dataFilePath, "utf-8");
  const payload = JSON.parse(payloadStr);
  await cache.save(payload, { useAsCurrent: true });
}

const store: AsyncStoreContext = {
  i18n: {
    english: { ui: english.ui },
    french: { ui: french.ui }
  },
  viewBuilder: new ViewBuilder({
    projectRootDir: import.meta.dirname,
    componentsDir: kComponentsDir
  }),
  cache
};
const htmlWatcher = chokidar.watch(kComponentsDir, {
  persistent: false,
  awaitWriteFinish: true,
  ignored: (path, stats) => (stats?.isFile() ?? false) && !path.endsWith(".html")
});

htmlWatcher.on("change", async(filePath) => {
  await buildContext.rebuild().catch(console.error);
  store.viewBuilder.freeCache(filePath);
});

const serving = sirv(kOutDir, { dev: true });

function defaultRoute(req: http.IncomingMessage, res: http.ServerResponse) {
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

const apiRouter = getApiRouter(defaultRoute);

http.createServer((req, res) => als.run(store, () => apiRouter.lookup(req, res)))
  .listen(kDevPort, () => {
    console.log(`Dev server: http://localhost:${kDevPort}`);
    open(`http://localhost:${kDevPort}`);
  });

new WebSocketServerInstanciator({ cache, logger });

console.log("Watching...");
