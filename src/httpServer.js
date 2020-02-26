"use strict";

// Require Node.js Dependencies
const { createReadStream, accessSync, constants: { R_OK, W_OK } } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const sirv = require("sirv");
const open = require("open");
const getPort = require("get-port");
const kleur = require("kleur");

// CONSTANTS
const VIEWS = join(__dirname, "..", "views");
const PUBLIC = join(__dirname, "..", "public");
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
            createReadStream(join(VIEWS, "index.html")).pipe(res);
        }
        catch (err) {
            send(res, 500, err.message);
        }
    });

    httpServer.get("/data", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        createReadStream(dataFilePath).pipe(res);
    });

    httpServer.get("/flags", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });

        res.end(JSON.stringify(FLAGS));
    });

    httpServer.get("/flags/description/:title", (req, res) => {
        if (flagsTitle.has(req.params.title)) {
            const flagDescription = join(__dirname, `../flags/${req.params.title}.html`);
            createReadStream(flagDescription).pipe(res);
        }
    });

    const port = typeof configPort === "number" ? configPort : await getPort();
    httpServer.listen(port, () => {
        const link = `http://localhost:${port}`;
        console.log(kleur.green().bold(" HTTP Server started at "), kleur.cyan().bold(link));
        if (typeof configPort === "undefined") {
            open(link);
        }
    });

    return httpServer;
}

module.exports = startHTTPServer;
