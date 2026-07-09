// Import Node.js Dependencies
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, test } from "node:test";

// Import Internal Dependencies
import { main } from "../../src/commands/re-highlight.js";

describe("re-hightlight", () => {
  test("should display an error when there is no scan", async(t) => {
    async function getScanResult() {
      throw new Error("file does not exist");
    }

    const logger = {
      logError: t.mock.fn(),
      logAndWrite: t.mock.fn()
    };

    await main({
      getScanResult,
      logger,
      contacts: ["TJ Holowaychuk"],
      packages: ["crc@0.2.0"],
      output: "some-file"
    });

    assert.deepEqual(logger.logError.mock.calls[0].arguments, ["cli.commands.reHighlight.error"]);
    assert.strictEqual(logger.logAndWrite.mock.callCount(), 0);
  });
  test("should rehighlight contacts and packages", async(t) => {
    const scanResult = JSON.parse(await readFile(path.join(import.meta.dirname, "..", "fixtures", "result-test1.json"), "utf8"));

    let expectedOutput;

    async function getScanResult(output) {
      expectedOutput = output;

      return Promise.resolve(scanResult);
    }

    const logger = {
      logError: t.mock.fn(),
      logAndWrite: t.mock.fn()
    };

    await main({
      getScanResult,
      logger,
      contacts: ["TJ Holowaychuk"],
      packages: ["crc@0.2.0"],
      output: "some-file"
    });

    assert.strictEqual(logger.logError.mock.callCount(), 0);
    assert.strictEqual(expectedOutput, "some-file");
    assert.deepEqual(logger.logAndWrite.mock.calls[0].arguments, [{
      ...scanResult,
      highlighted: {
        contacts: [
          {
            name: "TJ Holowaychuk",
            flags: [],
            dependencies: [
              "fresh",
              "range-parser",
              "commander",
              "send",
              "bytes",
              "pause",
              "connect",
              "express"
            ]
          }

        ],
        packages: ["crc@0.2.0"],
        identifiers: ["example@gmail.com"]
      }
    }, "some-file", {
      showWarnings: false
    }]);
  });
});

