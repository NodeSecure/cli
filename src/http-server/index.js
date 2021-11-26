/* eslint-disable no-sync */

// Import Node.js Dependencies
import fs from "fs";
import { join, dirname } from "path";
import { pipeline } from "stream";
import { fileURLToPath } from "url";

// Import Third-party Dependencies
import send from "@polka/send-type";
import kleur from "kleur";
import polka from "polka";
import sirv from "sirv";
import open from "open";
import * as i18n from "@nodesecure/i18n";
import { getFlags, lazyFetchFlagFile, getManifest } from "@nodesecure/flags";

// Import Internal Dependencies
import { context } from "./context.js";
import { root } from "./root.js";
import * as data from "./data.js";

// CONSTANTS
const __dirname = dirname(fileURLToPath(import.meta.url));
const kProjectRootDir = join(__dirname, "..", "..");
const kNodeSecureFlags = getFlags();

export function buildServer(dataFilePath, options = {}) {
  const httpConfigPort = typeof options.port === "number" ? options.port : 0;
  const openLink = typeof options.openLink === "boolean" ? options.openLink : true;

  fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);

  const httpServer = polka();

  httpServer.use((req, res, next) => {
    const store = { dataFilePath };
    context.run(store, next);
  });

  httpServer.use(sirv(join(kProjectRootDir, "dist"), { dev: true }));

  httpServer.get("/", root);

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
