"use strict";

// Require Node.js Dependencies
const { createReadStream } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send-type");
const sirv = require("sirv");

// CONSTANTS
const VIEWS = join(__dirname, "..", "views");
const PUBLIC = join(__dirname, "..", "public");

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

module.exports = httpServer;
