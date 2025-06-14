// Import Node.js Dependencies
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, describe, test, mock } from "node:test";
import { once } from "node:events";
import path from "node:path";
import assert from "node:assert";
import stream from "node:stream";

// Import Third-party Dependencies
import { get, post, MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import * as i18n from "@nodesecure/i18n";
import * as flags from "@nodesecure/flags";
import enableDestroy from "server-destroy";
import cacache from "cacache";

// Import Internal Dependencies
import { buildServer, BROWSER } from "../src/http-server/index.js";
import { CACHE_PATH } from "../src/cache.js";
import * as rootEndpoint from "../src/http-server/endpoints/root.js";
import * as flagsEndpoint from "../src/http-server/endpoints/flags.js";

// CONSTANTS
const kHttpPort = 17049;
const kHttpURL = new URL(`http://localhost:${kHttpPort}`);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JSON_PATH = path.join(__dirname, "fixtures", "httpServer.json");

const kConfigKey = "___config";
const kGlobalDispatcher = getGlobalDispatcher();
const kMockAgent = new MockAgent();
const kBundlephobiaPool = kMockAgent.get("https://bundlephobia.com");
const kDefaultPayloadPath = path.join(process.cwd(), "nsecure-result.json");

describe("httpServer", { concurrency: 1 }, () => {
  let httpServer;

  before(async() => {
    setGlobalDispatcher(kMockAgent);
    await i18n.extendFromSystemPath(
      path.join(__dirname, "..", "i18n")
    );

    httpServer = buildServer(JSON_PATH, {
      port: kHttpPort,
      openLink: false,
      enableWS: false
    });
    await once(httpServer.server, "listening");

    enableDestroy(httpServer.server);

    if (fs.existsSync(kDefaultPayloadPath) === false) {
      // When running tests on CI, we need to create the nsecure-result.json file
      const payload = fs.readFileSync(JSON_PATH, "utf-8");
      fs.writeFileSync(kDefaultPayloadPath, payload);
    }
  }, { timeout: 5000 });

  after(async() => {
    httpServer.server.destroy();
    kBundlephobiaPool.close();
    setGlobalDispatcher(kGlobalDispatcher);
  });

  test("'/' should return index.html content", async() => {
    const result = await get(kHttpURL);

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "text/html");
  });

  test("'/' should fail", async(ctx) => {
    class Response {
      constructor() {
        this.body = "";
        this.headers = {};
        this.statusCode = 200;
      }
      end(str) {
        this.body = str;
      }
      writeHead(int) {
        this.statusCode = int;
      }
      getHeader(key) {
        return this.headers[key];
      }
    }

    const fakeError = "fake error";
    function toThrow() {
      throw new Error(fakeError);
    }
    ctx.mock.method(Response.prototype, "writeHead", toThrow, { times: 1 });

    const response = new Response();
    await rootEndpoint.get({}, response);

    assert.strictEqual(response.body, JSON.stringify({ error: fakeError }));
    assert.strictEqual(response.statusCode, 500);
  });

  test("'/flags' should return the flags list as JSON", async() => {
    const result = await get(new URL("/flags", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
  });

  test("'/flags/description/isGit' should return the isGit HTML description", async() => {
    const result = await get(new URL("/flags/description/isGit", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "text/html");

    assert.equal(result.data, await flags.eagerFetchFlagFile("isGit"));
  });

  test("'/flags/description/foobar' should return a 404 error", async() => {
    await assert.rejects(async() => {
      await get(new URL("/flags/description/foobar", kHttpURL));
    }, {
      name: "HttpieOnHttpError",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("'/flags/description/:title' should fail", async(ctx) => {
    ctx.mock.method(stream, "pipeline", (_stream, _res, err) => err("fake error"));
    const logs = [];
    console.error = (data) => logs.push(data);

    await flagsEndpoint.get({ params: { title: "hasWarnings" } }, ({ writeHead: () => true }));
    assert.deepEqual(logs, ["fake error"]);
  });

  test("'/data' should return the fixture payload we expect", async() => {
    const result = await get(new URL("/data", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "application/json;charset=utf-8");
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
    const result = await get(new URL("/bundle/flatstr/1.0.12", kHttpURL));

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
      await get(new URL(`/bundle/flatstr/${wrongVersion}`, kHttpURL));
    },
    {
      name: "HttpieOnHttpError",
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
    const result = await get(new URL("/bundle/flatstr", kHttpURL));

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
      await get(new URL(`/bundle/${wrongPackageName}`, kHttpURL));
    }, {
      name: "HttpieOnHttpError",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("GET '/config' should return the config", async() => {
    const { data: actualConfig } = await get(new URL("/config", kHttpURL));

    const expectedConfig = {
      defaultPackageMenu: "foo",
      ignore: {
        flags: ["foo"],
        warnings: ["bar"]
      },
      theme: "galaxy",
      disableExternalRequests: true
    };

    await cacache.put(CACHE_PATH, kConfigKey, JSON.stringify(expectedConfig));
    const result = await get(new URL("/config", kHttpURL));

    assert.deepEqual(result.data, expectedConfig);

    await fetch(new URL("/config", kHttpURL), {
      method: "PUT",
      body: JSON.stringify(actualConfig),
      headers: { "Content-Type": "application/json" }
    });
  });

  test("PUT '/config' should update the config", async() => {
    const { data: actualConfig } = await get(new URL("/config", kHttpURL));
    // FIXME: use @mynusift/httpie instead of fetch. Atm it throws with put().
    // https://github.com/nodejs/undici/issues/583
    const { status } = await fetch(new URL("/config", kHttpURL), {
      method: "PUT",
      body: JSON.stringify({ fooz: "baz" }),
      headers: { "Content-Type": "application/json" }
    });

    assert.equal(status, 204);

    const inCache = await cacache.get(CACHE_PATH, kConfigKey);
    assert.deepEqual(JSON.parse(inCache.data.toString()), { fooz: "baz" });

    await fetch(new URL("/config", kHttpURL), {
      method: "PUT",
      body: JSON.stringify(actualConfig),
      headers: { "Content-Type": "application/json" }
    });
  });

  test("GET '/i18n' should return i18n", async() => {
    const result = await get(new URL("/i18n", kHttpURL));
    assert.equal(result.statusCode, 200);

    const keys = Object.keys(result.data);
    assert.deepEqual(keys, ["english", "french"]);
  });

  test("'/download/:pkgName' should return package downloads", async() => {
    const result = await get(new URL("/downloads/fastify", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.data.package, "fastify");
    assert.ok(result.data.downloads);
    assert.ok(result.data.start);
    assert.ok(result.data.end);
  });

  test("'/download/:pkgName' should not find package", async() => {
    const wrongPackageName = "br-br-br-brah";

    await assert.rejects(async() => {
      await get(new URL(`/downloads/${wrongPackageName}`, kHttpURL));
    }, {
      name: "HttpieOnHttpError",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("'/scorecard/:org/:pkgName' should return scorecard data", async() => {
    const result = await get(new URL("/scorecard/NodeSecure/cli", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.data.data.repo.name, "github.com/NodeSecure/cli");
  });

  test("'/scorecard/:org/:pkgName' should return scorecard data for GitLab repo", async() => {
    const result = await get(new URL("/scorecard/gitlab-org/gitlab-ui?platform=gitlab.com", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.data.data.repo.name, "gitlab.com/gitlab-org/gitlab-ui");
  });

  test("'/scorecard/:org/:pkgName' should not find repo", async() => {
    const wrongPackageName = "br-br-br-brah";

    await assert.rejects(async() => {
      await get(new URL(`/scorecard/NodeSecure/${wrongPackageName}`, kHttpURL));
    }, {
      name: "HttpieOnHttpError",
      statusCode: 404,
      statusMessage: "Not Found"
    });
  });

  test("'/report' should return a Buffer", async() => {
    const result = await post(new URL("/report", kHttpURL), { body: { title: "foo" } });

    assert.equal(result.statusCode, 200);
    const json = JSON.parse(result.data);
    assert.strictEqual(json.data.type, "Buffer");
  });

  test("'/search' should return the package list", async() => {
    const result = await get(new URL("/search/nodesecure", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.ok(result.data);
    assert.ok(Array.isArray(result.data.result));
    assert.ok(result.data.count);
  });
});

describe("httpServer without options", () => {
  let httpServer;
  let spawnOpen;
  // We want to disable WS
  process.env.NODE_ENV = "test";

  before(async() => {
    spawnOpen = mock.method(BROWSER, "open", () => void 0);
    httpServer = buildServer(JSON_PATH);
    await once(httpServer.server, "listening");
    enableDestroy(httpServer.server);
  });

  after(async() => {
    httpServer.server.destroy();
    spawnOpen.mock.restore();
  });

  test("should listen on random port and call childProcess.spawn method ('open' pkg) to open link", async() => {
    assert.ok(httpServer.server.address().port > 0);
    assert.strictEqual(spawnOpen.mock.callCount(), 1);
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
