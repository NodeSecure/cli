"use strict";

// Require Node.js Dependencies
const { readFile } = require("fs").promises;
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
        const HTMLContent = await readFile(join(VIEWS, "index.html"), "utf-8");
        send(res, 200, HTMLContent, { "Content-Type": "text/html" });
    }
    catch (err) {
        send(res, 500, err.message);
    }
});

module.exports = httpServer;
