// Import Node.js Dependencies
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, test } from "node:test";

// Import Internal Dependencies
import { main } from "../../src/commands/stats.js";

describe("stats", () => {
  test("it should log stats and errors from the scan result", async(t) => {
    const scanResult = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "fixtures", "result-test3.json"), "utf8"));

    async function getScanResult() {
      return Promise.resolve(scanResult);
    }

    const logger = {
      logScannerStat: t.mock.fn(),
      logScannerError: t.mock.fn(),
      log: t.mock.fn(),
      logError: t.mock.fn()
    };

    await main({
      getScanResult,
      logger
    });

    assert.deepEqual(logger.log.mock.calls[0].arguments, ["cli.commands.stats.elapsed", "771ms"]);
    assert.deepEqual(logger.log.mock.calls[1].arguments, ["cli.commands.stats.stats", 3]);
    assert.deepEqual(logger.logScannerStat.mock.calls[0].arguments, [{
      name: "pacote.manifest react@19.2.4",
      startedAt: 1774601089504,
      executionTime: 20
    }, false]);
    assert.deepEqual(logger.logScannerStat.mock.calls[1].arguments, [{
      name: "pacote.extract react@19.2.4",
      startedAt: 1774601089529,
      executionTime: 83
    }, false]);
    assert.deepEqual(logger.logScannerStat.mock.calls[2].arguments, [{
      name: "tarball.scanDirOrArchive react@19.2.4",
      startedAt: 1774601089612,
      executionTime: 247
    }, false]);
    assert.deepEqual(logger.log.mock.calls[2].arguments, ["cli.commands.stats.errors", 2]);
    assert.deepEqual(logger.logScannerError.mock.calls[0].arguments, [{
      name: "pacote.extract react@19.2.4"
    }]);
    assert.deepEqual(logger.logScannerError.mock.calls[1].arguments, [{
      name: "tarball.scanDirOrArchive react@19.2.4",
      message: "something went wrong !"
    }]);
  });

  test("should display an error message when no scan has been done", async(t) => {
    async function getScanResult() {
      throw new Error("file does not exist");
    }

    const logger = {
      logScannerStat: t.mock.fn(),
      logScannerError: t.mock.fn(),
      log: t.mock.fn(),
      logError: t.mock.fn()
    };

    await main({
      getScanResult,
      logger
    });

    assert.deepEqual(logger.logError.mock.calls[0].arguments, ["cli.commands.stats.error"]);
    assert.strictEqual(logger.log.mock.callCount(), 0);
    assert.strictEqual(logger.logScannerStat.mock.callCount(), 0);
    assert.strictEqual(logger.logScannerError.mock.callCount(), 0);
  });

  test("should not log the error part when there is none", async(t) => {
    const scanResult = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "fixtures", "result-test4.json"), "utf8"));

    async function getScanResult() {
      return Promise.resolve(scanResult);
    }

    const logger = {
      logScannerStat: t.mock.fn(),
      logScannerError: t.mock.fn(),
      log: t.mock.fn(),
      logError: t.mock.fn()
    };

    await main({
      getScanResult,
      logger
    });

    assert.deepEqual(logger.log.mock.calls[0].arguments, ["cli.commands.stats.elapsed", "771ms"]);
    assert.deepEqual(logger.log.mock.calls[1].arguments, ["cli.commands.stats.stats", 3]);
    assert.deepEqual(logger.logScannerStat.mock.calls[0].arguments, [{
      name: "pacote.manifest react@19.2.4",
      startedAt: 1774601089504,
      executionTime: 20
    }, false]);
    assert.deepEqual(logger.logScannerStat.mock.calls[1].arguments, [{
      name: "pacote.extract react@19.2.4",
      startedAt: 1774601089529,
      executionTime: 83
    }, false]);
    assert.deepEqual(logger.logScannerStat.mock.calls[2].arguments, [{
      name: "tarball.scanDirOrArchive react@19.2.4",
      startedAt: 1774601089612,
      executionTime: 247
    }, false]);
    assert.equal(logger.log.mock.calls[2], undefined);
  });

  test("should filter API calls when min parameter is provided", async(t) => {
    const scanResult = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "fixtures", "result-test3.json"), "utf8"));

    async function getScanResult() {
      return Promise.resolve(scanResult);
    }

    const logger = {
      logScannerStat: t.mock.fn(),
      logScannerError: t.mock.fn(),
      log: t.mock.fn(),
      logError: t.mock.fn()
    };

    await main({
      getScanResult,
      logger,
      min: 50
    });

    assert.deepEqual(logger.log.mock.calls[0].arguments, ["cli.commands.stats.elapsed", "771ms"]);
    assert.deepEqual(logger.log.mock.calls[1].arguments, ["cli.commands.stats.stats", 3]);
    assert.deepEqual(logger.log.mock.calls[2].arguments, ["cli.commands.stats.statsCeiling", "50ms", 2]);
    assert.deepEqual(logger.logScannerStat.mock.calls.length, 2);
    assert.deepEqual(logger.logScannerStat.mock.calls[0].arguments, [{
      name: "pacote.extract react@19.2.4",
      startedAt: 1774601089529,
      executionTime: 83
    }, false]);
    assert.deepEqual(logger.logScannerStat.mock.calls[1].arguments, [{
      name: "tarball.scanDirOrArchive react@19.2.4",
      startedAt: 1774601089612,
      executionTime: 247
    }, false]);
  });

  test("should not disply the ceiling log if api calls count and api calls count above min are the same", async(t) => {
    const scanResult = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "fixtures", "result-test3.json"), "utf8"));

    async function getScanResult() {
      return Promise.resolve(scanResult);
    }

    const logger = {
      logScannerStat: t.mock.fn(),
      logScannerError: t.mock.fn(),
      log: t.mock.fn(),
      logError: t.mock.fn()
    };

    await main({
      getScanResult,
      logger,
      min: 10
    });

    assert.deepEqual(logger.log.mock.calls[0].arguments, ["cli.commands.stats.elapsed", "771ms"]);
    assert.deepEqual(logger.log.mock.calls[1].arguments, ["cli.commands.stats.stats", 3]);
    assert.deepEqual(logger.log.mock.calls[2].arguments, ["cli.commands.stats.errors", 2]);
  });

  test("should log error when min parameter is not a number", async(t) => {
    const scanResult = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "fixtures", "result-test3.json"), "utf8"));

    async function getScanResult() {
      return Promise.resolve(scanResult);
    }

    const logger = {
      logScannerStat: t.mock.fn(),
      logScannerError: t.mock.fn(),
      log: t.mock.fn(),
      logError: t.mock.fn()
    };

    await main({
      getScanResult,
      logger,
      min: "not-a-number"
    });

    assert.deepEqual(logger.logError.mock.calls[0].arguments, ["cli.commands.stats.minNotANumber"]);
    assert.strictEqual(logger.logScannerStat.mock.callCount(), 0);
    assert.strictEqual(logger.log.mock.callCount(), 0);
  });
});

