// Load .env file if it exists (quiet - no error if missing)
try {
  process.loadEnvFile();
}
catch {
  // .env file not found or not readable - ignore silently
}

// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import { after, before, describe, it, mock } from "node:test";

// Import Third-party Dependencies
import { PayloadCache } from "@nodesecure/cache";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { main } from "../../src/commands/cache.js";

describe("CLI Commands: cache", { concurrency: 1 }, () => {
  let lang;

  before(async() => {
    await i18n.setLocalLang("english");
    await i18n.extendFromSystemPath(
      path.join(import.meta.dirname, "..", "..", "i18n")
    );
    lang = await i18n.getLocalLang();
  });

  after(async() => {
    await i18n.setLocalLang(lang);
    await i18n.getLocalLang();
    mock.restoreAll();
  });

  it("should list the cache", async(ctx) => {
    const logs = [];
    ctx.mock.method(console, "log", (msg) => logs.push(msg));

    const fakeCache = {
      load: async() => fakeCache,
      * [Symbol.iterator]() {
        yield { name: "test-pkg", version: "1.0.0" };
      }
    };
    ctx.mock.method(PayloadCache.prototype, "load", async function load() {
      Object.assign(this, { [Symbol.iterator]: fakeCache[Symbol.iterator] });

      return this;
    });

    await main({ list: true, clear: false });

    const allOutput = logs.join(" ");
    assert.ok(
      allOutput.includes(i18n.getTokenSync("cli.commands.cache.cacheTitle")),
      "should print cache title"
    );
  });

  it("should clear the cache", async(ctx) => {
    const logs = [];
    ctx.mock.method(console, "log", (msg) => logs.push(msg));

    let cacheClearCalled = false;
    ctx.mock.method(PayloadCache.prototype, "clear", async function clear() {
      cacheClearCalled = true;

      return this;
    });

    await main({ list: false, clear: true });

    assert.ok(cacheClearCalled, "should call PayloadCache.clear()");

    const allOutput = logs.join(" ");
    assert.ok(
      allOutput.includes(i18n.getTokenSync("cli.commands.cache.cleared")),
      "should print cleared message"
    );
  });

  it("should exit with error when no action is specified", async(ctx) => {
    const logs = [];
    ctx.mock.method(console, "log", (msg) => logs.push(msg));

    let exitCode;
    ctx.mock.method(process, "exit", (code) => {
      exitCode = code;
    });

    await main({ list: false, clear: false });

    assert.strictEqual(exitCode, 1, "should exit with code 1");
    const allOutput = logs.join(" ");
    assert.ok(
      allOutput.includes(i18n.getTokenSync("cli.commands.cache.missingAction")),
      "should print missing action error"
    );
  });
});
