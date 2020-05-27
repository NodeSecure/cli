"use strict";

// Require Node.js Dependencies
const {
    createReadStream, accessSync, promises: { readFile }, constants: { R_OK, W_OK }
} = require("fs");
const { join } = require("path");
const { pipeline } = require("stream");

// Require Third-party Dependencies
const send = require("@polka/send-type");
const kleur = require("kleur");
const polka = require("polka");
const sirv = require("sirv");
const open = require("open");
const zup = require("zup");

// Require Internal Dependencies
const i18n = require("./i18n");

// CONSTANTS
const VIEWS = join(__dirname, "..", "views");
const PUBLIC = join(__dirname, "..", "dist");
const FLAGS = require("../flags/manifest.json");
const flagsTitle = new Set(Object.values(FLAGS).map((flagDescriptor) => flagDescriptor.title));

async function startHTTPServer(dataFilePath, configPort) {
    accessSync(dataFilePath, R_OK | W_OK);
    // Create HTTP Server and apply required middlewares!
    const httpServer = polka();
    httpServer.use(sirv(PUBLIC, { dev: true }));

    httpServer.get("/", async(req, res) => {
        try {
            res.writeHead(200, {
                "Content-Type": "text/html"
            });
            const HTMLStr = await readFile(join(VIEWS, "index.html"), "utf-8");
            const templateStr = zup(HTMLStr)({
                lang: i18n.getToken("lang"),
                token: (tokenName) => i18n.getToken(`ui.${tokenName}`)
            });
            res.end(templateStr);
        }
        catch (err) {
            /* istanbul ignore next */
            send(res, 500, { error: err.message });
        }
    });

    httpServer.get("/data", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        pipeline(createReadStream(dataFilePath), res, (err) => {
            /* istanbul ignore next */
            if (err) {
                console.error(err);
            }
        });
    });

    httpServer.get("/flags", (req, res) => send(res, 200, FLAGS));
    httpServer.get("/flags/description/:title", (req, res) => {
        if (req.params.title !== "isDuplicate" && !flagsTitle.has(req.params.title)) {
            return send(res, 404, { error: "Not Found" });
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        const flagDescription = join(__dirname, `../flags/${req.params.title}.html`);

        return pipeline(createReadStream(flagDescription), res, (err) => {
            /* istanbul ignore next */
            if (err) {
                console.error(err);
            }
        });
    });

    /* istanbul ignore next */
    httpServer.listen(typeof configPort === "number" ? configPort : 0, () => {
        const link = `http://localhost:${httpServer.server.address().port}`;
        console.log(kleur.magenta().bold(i18n.getToken("cli.http_server_started")), kleur.cyan().bold(link));
        /* istanbul ignore next */
        if (typeof configPort === "undefined") {
            open(link);
        }
    });

    return httpServer;
}

module.exports = startHTTPServer;
