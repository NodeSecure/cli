"use strict";

// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const { get } = require("httpie");
const zup = require("zup");

// Require Internal Dependencies
const startHTTPServer = require("../src/httpServer");
const i18n = require("../src/i18n");

// CONSTANTS
const HTTP_PORT = 1337;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const JSON_PATH = join(__dirname, "fixtures", "httpServer", "payload.json");
const INDEX_HTML = readFileSync(join(__dirname, "..", "views", "index.html"), "utf-8");

// VARS
let httpServer;

beforeAll(async() => {
    httpServer = await startHTTPServer(JSON_PATH, HTTP_PORT);
});

afterAll(() => {
    httpServer.server.close();
});

test("'/' should return index.html HTML content", async() => {
    const result = await get(HTTP_URL);

    expect(result.statusCode).toStrictEqual(200);
    expect(result.headers["content-type"]).toStrictEqual("text/html");

    const templateStr = zup(INDEX_HTML)({ token: (tokenName) => i18n.getToken(`ui.${tokenName}`) });
    expect(result.data).toStrictEqual(templateStr);
});

test("'/data' should return the fixture payload we expect", async() => {
    const result = await get(new URL("/data", HTTP_URL));

    expect(result.statusCode).toStrictEqual(200);
    expect(result.headers["content-type"]).toStrictEqual("application/json");
    expect(result.data).toMatchSnapshot();
});
