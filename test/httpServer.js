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
const IS_GIT_HTML = readFileSync(join(__dirname, "..", "flags", "isGit.html"), "utf-8");

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

test("'/flags' should return the flags list as JSON", async() => {
    const result = await get(new URL("/flags", HTTP_URL));

    expect(result.statusCode).toStrictEqual(200);
    expect(result.headers["content-type"]).toStrictEqual("application/json");
    expect(result.data).toMatchSnapshot();
});

test("'/flags/description/isGit' should return the isGit HTML description", async() => {
    const result = await get(new URL("/flags/description/isGit", HTTP_URL));

    expect(result.statusCode).toStrictEqual(200);
    expect(result.headers["content-type"]).toStrictEqual("text/html");

    expect(result.data).toStrictEqual(IS_GIT_HTML);
});

test("'/flags/description/foobar' should return a 404 error", async() => {
    expect.assertions(2);
    try {
        await get(new URL("/flags/description/foobar", HTTP_URL));
    }
    catch (error) {
        expect(error.statusCode).toStrictEqual(404);
        expect(error.data).toStrictEqual("Not Found");
    }
});

test("'/data' should return the fixture payload we expect", async() => {
    const result = await get(new URL("/data", HTTP_URL));

    expect(result.statusCode).toStrictEqual(200);
    expect(result.headers["content-type"]).toStrictEqual("application/json");
    expect(result.data).toMatchSnapshot();
});
