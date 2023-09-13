// Import Node.js Dependencies
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { after, before, describe, test } from "node:test";
import assert from "node:assert";
import { once } from "node:events";

// Import Third-party Dependencies
import { get, MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import zup from "zup";
import * as i18n from "@nodesecure/i18n";
import * as flags from "@nodesecure/flags";
import enableDestroy from "server-destroy";
import esmock from "esmock";
import cacache from "cacache";

// Require Internal Dependencies
import { buildServer } from "../src/http-server/index.js";

// CONSTANTS
const HTTP_PORT = 17049;
const HTTP_URL = new URL(`http://localhost:${HTTP_PORT}`);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JSON_PATH = path.join(__dirname, "fixtures", "httpServer.json");
const INDEX_HTML = readFileSync(path.join(__dirname, "..", "views", "index.html"), "utf-8");

const kCachePath = path.join(os.tmpdir(), "nsecure-cli");
const kConfigKey = "cli-config";
const kGlobalDispatcher = getGlobalDispatcher();
const kMockAgent = new MockAgent();
const kBundlephobiaPool = kMockAgent.get("https://bundlephobia.com");

describe("httpServer", () => {
  let httpServer;

  before(async() => {
    setGlobalDispatcher(kMockAgent);

    httpServer = buildServer(JSON_PATH, {
      port: HTTP_PORT,
      openLink: false
    });
    await once(httpServer.server, "listening");

    enableDestroy(httpServer.server);
  }, { timeout: 5000 });

  after(() => {
    httpServer.server.destroy();
    kBundlephobiaPool.close();
    setGlobalDispatcher(kGlobalDispatcher);
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

  test("'/' should fail", async() => {
    const errors = [];
    const module = await esmock("../src/http-server/endpoints/root.js", {
      "@polka/send-type": {
        default: (res, status, { error }) => errors.push(error)
      }
    });

    await module.get({}, ({
      writeHead: () => {
        throw new Error("fake error");
      }
    }));
    assert.deepEqual(errors, ["fake error"]);
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

  test("'/flags/description/:title' should fail", async() => {
    const module = await esmock("../src/http-server/endpoints/flags.js", {
      stream: {
        pipeline: (stream, res, err) => err("fake error")
      },
      fs: {
        createReadStream: () => "foo"
      }
    });
    const consoleError = console.error;
    const logs = [];
    console.error = (data) => logs.push(data);

    await module.get({ params: { title: "hasWarnings" } }, ({ writeHead: () => true }));
    assert.deepEqual(logs, ["fake error"]);
  });

  test("'/data' should return the fixture payload we expect", async() => {
    const result = await get(new URL("/data", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json");
  });

  test("'/data' should fail", async() => {
    const module = await esmock("../src/http-server/endpoints/data.js", {
      "../src/http-server/context.js": {
        context: {
          getStore: () => {
            return { dataFilePath: "foo" };
          }
        }
      },
      stream: {
        pipeline: (stream, res, err) => err("fake error")
      },
      fs: {
        createReadStream: () => "foo"
      }
    });
    const consoleError = console.error;
    const logs = [];
    console.error = (data) => logs.push(data);

    await module.get({}, ({ writeHead: () => true }));
    assert.deepEqual(logs, ["fake error"]);
  });

  test("'/bundle/:name/:version' should return the bundle size", async() => {
    kBundlephobiaPool.intercept({
      path: () => true
    }).reply(200, {
      gzip: 1,
      size: 1,
      dependencySizes: {
        foo: 1
      }
    }, { headers: { "content-type": "application/json" } });
    const result = await get(new URL("/bundle/flatstr/1.0.12", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
    checkBundleResponse(result.data);
  });

  test("'/bundle/:name/:version' should return an error if it fails", async() => {
    kBundlephobiaPool.intercept({
      path: () => true
    }).reply(404);
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
    kBundlephobiaPool.intercept({
      path: () => true
    }).reply(200, {
      gzip: 1,
      size: 1,
      dependencySizes: {
        foo: 1
      }
    }, { headers: { "content-type": "application/json" } });
    const result = await get(new URL("/bundle/flatstr", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
    checkBundleResponse(result.data);
  });

  test("'/bundle/:name' should return an error if it fails", async() => {
    kBundlephobiaPool.intercept({
      path: () => true
    }).reply(404);
    const wrongPackageName = "br-br-br-brah";

    await assert.rejects(async() => {
      await get(new URL(`/bundle/${wrongPackageName}`, HTTP_URL));
    }, {
      name: "Error",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("GET '/config' should return the config", async() => {
    const { data: actualConfig } = await get(new URL("/config", HTTP_URL));

    await cacache.put(kCachePath, kConfigKey, JSON.stringify({ foo: "bar" }));
    const result = await get(new URL("/config", HTTP_URL));

    assert.deepEqual(result.data, { foo: "bar" });

    await fetch(new URL("/config", HTTP_URL), {
      method: "PUT",
      body: JSON.stringify(actualConfig),
      headers: { "Content-Type": "application/json" }
    });
  });

  test("PUT '/config' should update the config", async() => {
    const { data: actualConfig } = await get(new URL("/config", HTTP_URL));
    // FIXME: use @mynusift/httpie instead of fetch. Atm it throws with put().
    // https://github.com/nodejs/undici/issues/583
    const { status } = await fetch(new URL("/config", HTTP_URL), {
      method: "PUT",
      body: JSON.stringify({ fooz: "baz" }),
      headers: { "Content-Type": "application/json" }
    });

    assert.equal(status, 204);

    const inCache = await cacache.get(kCachePath, kConfigKey);
    assert.deepEqual(JSON.parse(inCache.data.toString()), { fooz: "baz" });

    await fetch(new URL("/config", HTTP_URL), {
      method: "PUT",
      body: JSON.stringify(actualConfig),
      headers: { "Content-Type": "application/json" }
    });
  });

  test("'/download/:pkgName' should return package downloads", async() => {
    const result = await get(new URL("/downloads/fastify", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.data.package, "fastify");
    assert.ok(result.data.downloads);
    assert.ok(result.data.start);
    assert.ok(result.data.end);
  });

  test("'/download/:pkgName' should not find package", async() => {
    const wrongPackageName = "br-br-br-brah";

    await assert.rejects(async() => {
      await get(new URL(`/downloads/${wrongPackageName}`, HTTP_URL));
    }, {
      name: "Error",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("'/scorecard/:org/:pkgName' should return scorecard data", async() => {
    const result = await get(new URL("/scorecard/NodeSecure/cli", HTTP_URL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.data.data.repo.name, "github.com/NodeSecure/cli");
  });

  test("'/scorecard/:org/:pkgName' should not find repo", async() => {
    const wrongPackageName = "br-br-br-brah";

    await assert.rejects(async() => {
      await get(new URL(`/scorecard/NodeSecure/${wrongPackageName}`, HTTP_URL));
    }, {
      name: "Error",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });
});

describe("httpServer without options", () => {
  let httpServer;
  let opened = false;

  before(async() => {
    const module = await esmock("../src/http-server/index.js", {
      open: () => (opened = true)
    });

    httpServer = module.buildServer(JSON_PATH);
    await once(httpServer.server, "listening");
    enableDestroy(httpServer.server);
  });

  after(() => {
    httpServer.server.destroy();
  });

  test("should listen on random port", () => {
    assert.ok(httpServer.server.address().port > 0);
  });

  test("should have openLink to true", () => {
    assert.equal(opened, true);
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
