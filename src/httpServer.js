/* eslint-disable no-sync */

// Import Node.js Dependencies
import fs from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { pipeline } from "stream";

// Import Third-party Dependencies
import send from "@polka/send-type";
import kleur from "kleur";
import polka from "polka";
import sirv from "sirv";
import open from "open";
import zup from "zup";
import i18n from "@nodesecure/i18n";
import { getFlags, getFlagFile, getManifest } from "@nodesecure/flags";

// CONSTANTS
const kNodeSecureFlags = getFlags();
const kProjectRootDir = join(__dirname, "..");

export async function startHTTPServer(dataFilePath, configPort) {
  fs.accessSync(dataFilePath, fs.constants.R_OK | fs.constants.W_OK);

  const httpServer = polka();
  httpServer.use(sirv(join(kProjectRootDir, "dist"), { dev: true }));

  httpServer.get("/", async(req, res) => {
    try {
      res.writeHead(200, {
        "Content-Type": "text/html"
      });

      const HTMLStr = await readFile(join(kProjectRootDir, "views", "index.html"), "utf-8");
      const templateStr = zup(HTMLStr)({
        lang: i18n.getToken("lang"),
        token: (tokenName) => i18n.getToken(`ui.${tokenName}`)
      });

      res.end(templateStr);
    }
    catch (err) {
      send(res, 500, { error: err.message });
    }
  });

  httpServer.get("/data", (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    pipeline(fs.createReadStream(dataFilePath), res, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });

  httpServer.get("/flags", (req, res) => send(res, 200, getManifest()));
  httpServer.get("/flags/description/:title", (req, res) => {
    if (req.params.title !== "isDuplicate" && !kNodeSecureFlags.has(req.params.title)) {
      return send(res, 404, { error: "Not Found" });
    }

    res.writeHead(200, { "Content-Type": "text/html" });

    return pipeline(getFlagFile(req.params.title), res, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });

  /* istanbul ignore next */
  httpServer.listen(typeof configPort === "number" ? configPort : 0, () => {
    const link = `http://localhost:${httpServer.server.address().port}`;
    console.log(kleur.magenta().bold(i18n.getToken("cli.http_server_started")), kleur.cyan().bold(link));

    if (typeof configPort === "undefined") {
      open(link);
    }
  });

  return httpServer;
}
