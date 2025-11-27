// Import Node.js Dependencies
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, describe, test } from "node:test";
import { once } from "node:events";
import path from "node:path";
import assert from "node:assert";
import stream from "node:stream";

// Import Third-party Dependencies
import { get, post, MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@openally/httpie";
import { CACHE_PATH } from "@nodesecure/cache";
import * as i18n from "@nodesecure/i18n";
import * as flags from "@nodesecure/flags";
import enableDestroy from "server-destroy";
import cacache from "cacache";
import { type Polka } from "polka";

// Import Internal Dependencies
import { buildServer } from "../index.js";
import * as flagsEndpoint from "../src/endpoints/flags.js";

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
const kProjectRootDir = path.join(import.meta.dirname, "..", "..", "..");
const kComponentsDir = path.join(kProjectRootDir, "public", "components");

describe("httpServer", { concurrency: 1 }, () => {
  let httpServer: Polka;

  before(async() => {
    setGlobalDispatcher(kMockAgent);
    await i18n.extendFromSystemPath(
      path.join(__dirname, "..", "..", "..", "i18n")
    );

    httpServer = buildServer(JSON_PATH, {
      projectRootDir: kProjectRootDir,
      componentsDir: kComponentsDir,
      i18n: {
        english: {
          ui: {}
        },
        french: {
          ui: {}
        }
      }
    });
    httpServer.listen(kHttpPort);
    await once(httpServer.server!, "listening");

    enableDestroy(httpServer.server!);

    if (fs.existsSync(kDefaultPayloadPath) === false) {
      // When running tests on CI, we need to create the nsecure-result.json file
      const payload = fs.readFileSync(JSON_PATH, "utf-8");
      fs.writeFileSync(kDefaultPayloadPath, payload);
    }
  }, { timeout: 5000 });

  after(async() => {
    httpServer.server!.destroy();
    kBundlephobiaPool.close();
    setGlobalDispatcher(kGlobalDispatcher);
  });

  test("'/' should return index.html content", async() => {
    const result = await get(kHttpURL);

    assert.equal(result.statusCode, 200);
    assert.equal(result.headers["content-type"], "text/html");
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
    ctx.mock.method(stream, "pipeline", (_stream: any, _res: any, err: any) => err("fake error"));
    const logs: string[] = [];
    console.error = (data: string) => logs.push(data);

    await flagsEndpoint.get({ params: { title: "hasWarnings" } } as any, ({ writeHead: () => true }) as any);
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
    // FIXME: use @openally/httpie instead of fetch. Atm it throws with put().
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
    const result = await get<any>(new URL("/i18n", kHttpURL));
    assert.equal(result.statusCode, 200);

    const keys = Object.keys(result.data);
    assert.deepEqual(keys, ["english", "french"]);
  });

  test("'/download/:pkgName' should return package downloads", async() => {
    const result = await get<any>(new URL("/downloads/fastify", kHttpURL));

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
    const result = await get<any>(new URL("/scorecard/NodeSecure/cli", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.equal(result.data.data.repo.name, "github.com/NodeSecure/cli");
  });

  test("'/scorecard/:org/:pkgName' should return scorecard data for GitLab repo", async() => {
    const result = await get<any>(new URL("/scorecard/gitlab-org/gitlab-ui?platform=gitlab.com", kHttpURL));

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
    const result = await post<Buffer>(
      new URL("/report", kHttpURL),
      {
        body: { title: "foo" },
        mode: "raw"
      }
    );

    assert.equal(result.statusCode, 200);
    assert.ok(Buffer.isBuffer(result.data));
  });

  test("'/search' should return the package list", async() => {
    const result = await get<any>(new URL("/search/nodesecure", kHttpURL));

    assert.equal(result.statusCode, 200);
    assert.ok(result.data);
    assert.ok(Array.isArray(result.data.result));
    assert.ok(result.data.count);
  });
});

describe("httpServer without options", () => {
  let httpServer: any;
  // We want to disable WS
  process.env.NODE_ENV = "test";

  before(async() => {
    httpServer = buildServer(JSON_PATH, {
      projectRootDir: kProjectRootDir,
      componentsDir: kComponentsDir,
      i18n: {
        english: {
          ui: {}
        },
        french: {
          ui: {}
        }
      }
    });
    httpServer.listen();
    await once(httpServer.server, "listening");
    enableDestroy(httpServer.server);
  });

  after(async() => {
    httpServer.server.destroy();
  });

  test("should listen on random port", async() => {
    assert.ok(httpServer.server.address().port > 0);
  });
});

/**
 * HELPERS
 */

function checkBundleResponse(payload: any) {
  assert.ok(payload.gzip);
  assert.ok(payload.size);
  assert.ok(payload.dependencySizes);
}
