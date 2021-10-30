// Require Node.js Dependencies
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Require Third-party Dependencies
import { get } from "httpie";
import zup from "zup";
import * as i18n from "@nodesecure/i18n";
import * as flags from "@nodesecure/flags";

// Require Internal Dependencies
import { startHTTPServer } from "../src/httpServer.js";

// CONSTANTS
const HTTP_PORT = 1337;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JSON_PATH = path.join(__dirname, "fixtures", "httpServer.json");
const INDEX_HTML = readFileSync(path.join(__dirname, "..", "views", "index.html"), "utf-8");

// VARS
let httpServer;

beforeAll(async() => {
  httpServer = await startHTTPServer(JSON_PATH, {
    configPort: HTTP_PORT,
    openLink: false
  });
});

afterAll(() => {
  httpServer.server.close();
});

test("'/' should return index.html HTML content", async() => {
  const result = await get(HTTP_URL);

  expect(result.statusCode).toStrictEqual(200);
  expect(result.headers["content-type"]).toStrictEqual("text/html");

  const templateStr = zup(INDEX_HTML)({
    lang: i18n.getToken("lang"),
    token: (tokenName) => i18n.getToken(`ui.${tokenName}`)
  });
  expect(result.data).toStrictEqual(templateStr);
});

test("'/flags' should return the flags list as JSON", async() => {
  const result = await get(new URL("/flags", HTTP_URL));

  expect(result.statusCode).toStrictEqual(200);
  expect(result.headers["content-type"]).toStrictEqual("application/json;charset=utf-8");
  expect(result.data).toMatchSnapshot();
});

test("'/flags/description/isGit' should return the isGit HTML description", async() => {
  const result = await get(new URL("/flags/description/isGit", HTTP_URL));

  expect(result.statusCode).toStrictEqual(200);
  expect(result.headers["content-type"]).toStrictEqual("text/html");

  expect(result.data).toStrictEqual(await flags.eagerFetchFlagFile("isGit"));
});

test("'/flags/description/foobar' should return a 404 error", async() => {
  expect.assertions(2);
  try {
    await get(new URL("/flags/description/foobar", HTTP_URL));
  }
  catch (error) {
    expect(error.statusCode).toStrictEqual(404);
    expect(error.data.error).toStrictEqual("Not Found");
  }
});

test("'/data' should return the fixture payload we expect", async() => {
  const result = await get(new URL("/data", HTTP_URL));

  expect(result.statusCode).toStrictEqual(200);
  expect(result.headers["content-type"]).toStrictEqual("application/json");
  expect(result.data).toMatchSnapshot();
});
