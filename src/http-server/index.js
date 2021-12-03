/* eslint-disable no-sync */

// Import Node.js Dependencies
import fs from "fs";

// Import Third-party Dependencies
import kleur from "kleur";
import polka from "polka";
import open from "open";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import * as root from "./root.js";
import * as data from "./data.js";
import * as flags from "./flags.js";
import * as bundle from "./bundle.js";
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
  httpServer.get("/flags", flags.getAll);
  httpServer.get("/flags/description/:title", flags.get);
  httpServer.get("/bundle/:pkgName", bundle.get);
  httpServer.get("/bundle/:pkgName/:version", bundle.get);

  httpServer.listen(httpConfigPort, () => {
    const link = `http://localhost:${httpServer.server.address().port}`;
    console.log(kleur.magenta().bold(i18n.getToken("cli.http_server_started")), kleur.cyan().bold(link));

    if (openLink) {
      open(link);
    }
  });

  return httpServer;
}
