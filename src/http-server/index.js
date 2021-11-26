/* eslint-disable no-sync */

// Import Node.js Dependencies
import fs from "fs";
import { pipeline } from "stream";

// Import Third-party Dependencies
import send from "@polka/send-type";
import kleur from "kleur";
import polka from "polka";
import open from "open";
import * as i18n from "@nodesecure/i18n";
import { getFlags, lazyFetchFlagFile, getManifest } from "@nodesecure/flags";

// Import Internal Dependencies
import * as root from "./root.js";
import * as data from "./data.js";
import * as middleware from "./middleware.js";

// CONSTANTS
const kNodeSecureFlags = getFlags();

export function buildServer(dataFilePath, options = {}) {
  const httpConfigPort = typeof options.port === "number" ? options.port : 0;
  const openLink = typeof options.openLink === "boolean" ? options.openLink : true;

  fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);

  const httpServer = polka();

  httpServer.use(middleware.buildContextMiddleware(dataFilePath));

  httpServer.use(middleware.addStaticFiles);

  httpServer.get("/", root.get);

  httpServer.get("/data", data.get);

  httpServer.get("/flags", (req, res) => send(res, 200, getManifest()));
  httpServer.get("/flags/description/:title", (req, res) => {
    if (req.params.title !== "isDuplicate" && !kNodeSecureFlags.has(req.params.title)) {
      return send(res, 404, { error: "Not Found" });
    }

    res.writeHead(200, { "Content-Type": "text/html" });

    return pipeline(lazyFetchFlagFile(req.params.title), res, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });

  httpServer.listen(httpConfigPort, () => {
    const link = `http://localhost:${httpServer.server.address().port}`;
    console.log(kleur.magenta().bold(i18n.getToken("cli.http_server_started")), kleur.cyan().bold(link));

    if (openLink) {
      open(link);
    }
  });

  return httpServer;
}
