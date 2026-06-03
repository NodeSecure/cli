// Import Node.js Dependencies
import assert from "node:assert";
import { createRequire } from "node:module";
import { describe, it, mock, afterEach } from "node:test";

const require = createRequire(import.meta.url);

describe("bin/check-and-run.cjs", () => {
  afterEach(() => {
    mock.restoreAll();
    // Clear the require cache so the file executes again for each test
    delete require.cache[require.resolve("../../bin/check-and-run.cjs")];
  });

  it("should exit with code 1 if semver.satisfies returns false", (ctx) => {
    const logs = [];
    ctx.mock.method(console, "error", (msg) => logs.push(msg));

    ctx.mock.method(process, "exit", (code) => {
      throw new Error(`process.exit(${code}) called`);
    });

    // Mock semver to simulate a failed version check
    const semver = require("semver");
    ctx.mock.method(semver, "satisfies", () => false);

    assert.throws(
      () => require("../../bin/check-and-run.cjs"),
      { message: "process.exit(1) called" },
      "should halt execution and exit with code 1"
    );
    
    const allLogs = logs.join("");
    assert.ok(allLogs.includes("@nodesecure/cli requires Node.js"), "should print required Node.js version message");
  });

  it("should not exit if semver.satisfies returns true", (ctx) => {
    let exitCode;
    ctx.mock.method(process, "exit", (code) => {
      exitCode = code;
    });

    // Mock semver to simulate a successful version check
    const semver = require("semver");
    ctx.mock.method(semver, "satisfies", () => true);

    require("../../bin/check-and-run.cjs");

    assert.strictEqual(exitCode, undefined, "should not call process.exit");
  });
});
