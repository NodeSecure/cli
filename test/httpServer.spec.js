// Import Node.js Dependencies
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Import Third-party Dependencies
import test from "tape";
import { get } from "@myunisoft/httpie";
import zup from "zup";
import * as i18n from "@nodesecure/i18n";
import * as flags from "@nodesecure/flags";

// Require Internal Dependencies
import { buildServer } from "../src/http-server/index.js";

// CONSTANTS
const HTTP_PORT = 1337;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JSON_PATH = path.join(__dirname, "fixtures", "httpServer.json");
const INDEX_HTML = readFileSync(path.join(__dirname, "..", "views", "index.html"), "utf-8");

// VARS
const httpServer = buildServer(JSON_PATH, {
  port: HTTP_PORT,
  openLink: false
});

test("'/' should return index.html content", async(tape) => {
  const result = await get(HTTP_URL);

  tape.equal(result.statusCode, 200);
  tape.equal(result.headers["content-type"], "text/html");

  const templateStr = zup(INDEX_HTML)({
    lang: i18n.getToken("lang"),
    token: (tokenName) => i18n.getToken(`ui.${tokenName}`)
  });
  tape.equal(result.data, templateStr);

  tape.end();
});

test("'/flags' should return the flags list as JSON", async(tape) => {
  const result = await get(new URL("/flags", HTTP_URL));

  tape.equal(result.statusCode, 200);
  tape.equal(result.headers["content-type"], "application/json;charset=utf-8");

  tape.end();
});

test("'/flags/description/isGit' should return the isGit HTML description", async(tape) => {
  const result = await get(new URL("/flags/description/isGit", HTTP_URL));

  tape.equal(result.statusCode, 200);
  tape.equal(result.headers["content-type"], "text/html");

  tape.equal(result.data, await flags.eagerFetchFlagFile("isGit"));

  tape.end();
});

test("'/flags/description/foobar' should return a 404 error", async(tape) => {
  tape.plan(2);

  try {
    await get(new URL("/flags/description/foobar", HTTP_URL));
  }
  catch (error) {
    tape.equal(error.statusCode, 404);
    tape.equal(error.data.error, "Not Found");
  }

  tape.end();
});

test("'/data' should return the fixture payload we expect", async(tape) => {
  const result = await get(new URL("/data", HTTP_URL));

  tape.equal(result.statusCode, 200);
  tape.equal(result.headers["content-type"], "application/json");
  // tape.equal(result.data).toMatchSnapshot();

  tape.end();
});

test("'/bundle/:name/:version' should return the bundle size", async(tape) => {
  const result = await get(new URL("/bundle/flatstr/1.0.12", HTTP_URL));

  tape.equal(result.statusCode, 200);
  tape.equal(result.headers["content-type"], "application/json;charset=utf-8");
  checkBundleResponse(tape, result.data);
});

test("'/bundle/:name/:version' should return an error if it fails", async(tape) => {
  tape.plan(2);
  const wrongVersion = undefined;
  const wrongPackageName = "br-br-br-brah";

  try {
    await get(new URL(`/bundle/${wrongPackageName}/${wrongVersion}`, HTTP_URL));
  }
  catch (error) {
    tape.equal(error.statusCode, 404);
    tape.equal(error.data.error, "Not Found");
  }

  tape.end();
});

test("'/bundle/:name' should return the bundle size of the last version", async(tape) => {
  const result = await get(new URL("/bundle/flatstr", HTTP_URL));

  tape.equal(result.statusCode, 200);
  tape.equal(result.headers["content-type"], "application/json;charset=utf-8");
  checkBundleResponse(tape, result.data);
});

test("teardown", (tape) => {
  httpServer.server.close();
  tape.end();
});

/**
 * HELPERS
 */

function checkBundleResponse(tapeInstance, payload) {
  tapeInstance.ok(payload.gzip);
  tapeInstance.ok(payload.size);
  tapeInstance.ok(payload.dependencySizes);
}
