// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import kleur from "kleur";
import polka from "polka";
import open from "open";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import * as root from "./endpoints/root.js";
import * as data from "./endpoints/data.js";
import * as flags from "./endpoints/flags.js";
import * as config from "./endpoints/config.js";
import * as bundle from "./endpoints/bundle.js";
import * as npmDownloads from "./endpoints/npm-downloads.js";
import * as scorecard from "./endpoints/ossf-scorecard.js";
import * as locali18n from "./endpoints/i18n.js";
import * as middleware from "./middleware.js";

export function buildServer(dataFilePath, options = {}) {
  const httpConfigPort = typeof options.port === "number" ? options.port : 0;
  const openLink = typeof options.openLink === "boolean" ? options.openLink : true;

  fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);

  const httpServer = polka();

  httpServer.use(middleware.buildContextMiddleware(dataFilePath));
  httpServer.use(middleware.addStaticFiles);
  httpServer.get("/", root.get);
  httpServer.get("/data", data.get);
  httpServer.get("/data", data.get);
  httpServer.get("/config", config.get);
  httpServer.put("/config", config.save);
  httpServer.get("/i18n", locali18n.get);

  httpServer.get("/flags", flags.getAll);
  httpServer.get("/flags/description/:title", flags.get);
  httpServer.get("/bundle/:pkgName", bundle.get);
  httpServer.get("/bundle/:pkgName/:version", bundle.get);
  httpServer.get("/downloads/:pkgName", npmDownloads.get);
  httpServer.get("/scorecard/:org/:pkgName", scorecard.get);

  httpServer.listen(httpConfigPort, async() => {
    const port = httpServer.server.address().port;
    const link = `http://localhost:${port}`;
    console.log(kleur.magenta().bold(await i18n.getToken("cli.http_server_started")), kleur.cyan().bold(link));

    if (openLink) {
      open(link);
    }
  });

  return httpServer;
}
