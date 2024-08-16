import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Third-party Dependencies
import stripAnsi from "strip-ansi";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { runProcess } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "summary.js");

describe("CLI Commands: summary", () => {
  it("should execute command on fixture 'result-test1.json'", async() => {
    await i18n.setLocalLang("english");
    const lines = [
      /Global Stats: express.*$/,
      /.*/,
      /Total of packages:.*65.*$/,
      /Total size:.*1.62 MB.*$/,
      /Packages with indirect dependencies:.*6.*$/,
      /.*/,
      /Extensions:.*$/,
      /\(48\) {2}- \(50\) \.md - \(50\) \.json - \(50\) \.js - \(5\) \.ts - \(2\) \.yml.*$/,
      /.*/,
      /Licenses:.*$/,
      /\(47\) MIT - \(2\) ISC.*$/,
      /.*/
    ];

    const processOptions = {
      path: kProcessPath,
      cwd: path.join(__dirname, "..", "fixtures")
    };

    for await (const line of runProcess(processOptions)) {
      const regexp = lines.shift();
      assert.ok(regexp, "we are expecting this line");
      assert.ok(regexp.test(stripAnsi(line)), `line (${line}) matches ${regexp}`);
    }
  });

  it("should not have dependencies", async() => {
    const expectedLines = [
      /Global Stats: express.*$/,
      /.*/,
      /Error:.*No dependencies.*$/,
      /.*/
    ];
    const processOptions = {
      path: kProcessPath.replace("summary.js", "summary-zero-dependencies.js"),
      cwd: path.join(__dirname, "..", "fixtures")
    };

    for await (const line of runProcess(processOptions)) {
      const expectedLineRegex = expectedLines.shift();
      const formattedLine = stripAnsi(line);
      assert.ok(expectedLineRegex, "we are expecting this line");
      assert.ok(expectedLineRegex.test(formattedLine), `line (${formattedLine}) should match ${expectedLineRegex}`);
    }
  });
});
