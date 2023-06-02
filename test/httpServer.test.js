// Import Node.js Dependencies
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import { get } from "@myunisoft/httpie";
import zup from "zup";
import * as i18n from "@nodesecure/i18n";
import * as flags from "@nodesecure/flags";
import enableDestroy from "server-destroy";

// Require Internal Dependencies
import { buildServer } from "../src/http-server/index.js";

// CONSTANTS
const HTTP_PORT = 17049;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JSON_PATH = path.join(__dirname, "fixtures", "httpServer.json");
const INDEX_HTML = readFileSync(path.join(__dirname, "..", "views", "index.html"), "utf-8");

describe("httpServer", () => {
  let httpServer;

  before((done) => {
    httpServer = buildServer(JSON_PATH, {
      port: HTTP_PORT,
      openLink: false
    });
    httpServer.server.on("listening", () => done(1));
    enableDestroy(httpServer.server);
  }, { timeout: 5000 });

  after(() => {
    httpServer.server.destroy();
  });

  test("'/' should return index.html content", async() => {
    await i18n.getLocalLang();
    const result = await get(HTTP_URL);

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "text/html");

    const templateStr = zup(INDEX_HTML)({
      lang: i18n.getTokenSync("lang"),
      token: (tokenName) => i18n.getTokenSync(`ui.${tokenName}`)
    });
    assert.equal(result.data, templateStr);
  });

  test("'/flags' should return the flags list as JSON", async() => {
    const result = await get(new URL("/flags", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
  });

  test("'/flags/description/isGit' should return the isGit HTML description", async() => {
    const result = await get(new URL("/flags/description/isGit", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "text/html");

    assert.equal(result.data, await flags.eagerFetchFlagFile("isGit"));
  });

  test("'/flags/description/foobar' should return a 404 error", async() => {
    await assert.rejects(async() => {
      await get(new URL("/flags/description/foobar", HTTP_URL));
    }, {
      name: "Error",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("'/data' should return the fixture payload we expect", async() => {
    const result = await get(new URL("/data", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json");
  });

  test("'/bundle/:name/:version' should return the bundle size", async() => {
    const result = await get(new URL("/bundle/flatstr/1.0.12", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
    checkBundleResponse(result.data);
  });

  test("'/bundle/:name/:version' should return an error if it fails", async() => {
    const wrongVersion = undefined;

    await assert.rejects(async() => {
      await get(new URL(`/bundle/flatstr/${wrongVersion}`, HTTP_URL));
    },
    {
      name: "Error",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("'/bundle/:name' should return the bundle size of the last version", async() => {
    const result = await get(new URL("/bundle/flatstr", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
    checkBundleResponse(result.data);
  });

  test("'/bundle/:name' should return an error if it fails", async() => {
    const wrongPackageName = "br-br-br-brah";

    await assert.rejects(async() => {
      await get(new URL(`/bundle/${wrongPackageName}`, HTTP_URL));
    }, {
      name: "Error",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });
});

/**
 * HELPERS
 */

function checkBundleResponse(payload) {
  assert.ok(payload.gzip);
  assert.ok(payload.size);
  assert.ok(payload.dependencySizes);
}
