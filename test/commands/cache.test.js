import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import assert from "node:assert";
import childProcess from "node:child_process";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import { appCache, DEFAULT_PAYLOAD_PATH } from "@nodesecure/cache";

// Import Internal Dependencies
import { arrayFromAsync } from "../helpers/utils.js";
import { main } from "../../src/commands/cache.js";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

describe("Cache command", { concurrency: 1 }, () => {
  let lang;
  let actualCache;
  let dummyPayload = null;

  before(async() => {
    if (fs.existsSync(DEFAULT_PAYLOAD_PATH) === false) {
      dummyPayload = {
        rootDependencyName: "test_runner",
        dependencies: {
          test_runner: {
            versions: {
              "1.0.0": {}
            }
          }
        }
      };
      fs.writeFileSync(DEFAULT_PAYLOAD_PATH, JSON.stringify(dummyPayload));
    }
    await i18n.setLocalLang("english");
    await i18n.extendFromSystemPath(
      path.join(__dirname, "..", "..", "i18n")
    );
    lang = await i18n.getLocalLang();

    try {
      actualCache = await appCache.payloadsList();
    }
    catch {
      await appCache.initPayloadsList({ logging: false });
      actualCache = await appCache.payloadsList();
    }

    appCache.updatePayload("test-package", { foo: "bar" });
  });

  after(async() => {
    await i18n.setLocalLang(lang);
    await i18n.getLocalLang();

    await appCache.updatePayloadsList(actualCache, { logging: false });
    appCache.removePayload("test-package");

    if (dummyPayload !== null) {
      fs.rmSync(DEFAULT_PAYLOAD_PATH);
    }
  });

  it("should list the cache", async() => {
    const cp = childProcess.spawn("node", [
      ".",
      "cache",
      "-l"
    ]);
    const stdout = await arrayFromAsync(cp.stdout);
    const inlinedStdout = stdout.join("");
    assert.ok(inlinedStdout.includes(i18n.getTokenSync("cli.commands.cache.cacheTitle")));
    assert.strictEqual(inlinedStdout.includes(i18n.getTokenSync("cli.commands.cache.scannedPayloadsTitle")), false);
  });

  it("should list the cache and scanned payloads on disk", async() => {
    const cp = childProcess.spawn("node", [
      ".",
      "cache",
      "-lf"
    ]);
    const stdout = await arrayFromAsync(cp.stdout);
    const inlinedStdout = stdout.join("");
    assert.ok(inlinedStdout.includes(i18n.getTokenSync("cli.commands.cache.cacheTitle")));
    assert.ok(inlinedStdout.includes(i18n.getTokenSync("cli.commands.cache.scannedPayloadsTitle")));
  });

  it("should clear the cache", async(ctx) => {
    let rmSyncCalled = false;
    ctx.mock.method(fs, "rmSync", () => {
      rmSyncCalled = true;
    });
    await main({
      clear: true,
      full: false
    });
    assert.strictEqual(rmSyncCalled, false, "should not have removed payloads on disk without --full option");
  });

  it("should clear the cache and payloads on disk", async(ctx) => {
    let rmSyncCalled = false;
    ctx.mock.method(fs, "rmSync", () => {
      rmSyncCalled = true;
    });
    await main({
      clear: true,
      full: true
    });
    assert.ok(rmSyncCalled, "should have removed payloads on disk with --full option");
  });
});
