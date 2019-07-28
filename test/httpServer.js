"use strict";

// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const { get } = require("httpie");

// Require Internal Dependencies
const httpServer = require("../src/httpServer");

// CONSTANTS
const HTTP_PORT = 1337;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const INDEX_HTML = readFileSync(join(__dirname, "..", "views", "index.html"), "utf-8");

beforeAll(async() => {
    await new Promise((resolve) => httpServer.listen(HTTP_PORT, resolve));
});

afterAll(() => {
    httpServer.server.close();
});

test("'/' should return index.html HTML content", async() => {
    const result = await get(HTTP_URL);

    expect(result.statusCode).toStrictEqual(200);
    expect(result.headers["content-type"]).toStrictEqual("text/html");
    expect(result.data).toStrictEqual(INDEX_HTML);
});
