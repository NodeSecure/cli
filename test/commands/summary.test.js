import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it } from "node:test";
import { stripVTControlCharacters } from "node:util";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { runProcess } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "summary.js");

describe("CLI Commands: summary", () => {
  it("should execute command on fixture 'result-test1.json'", async(t) => {
    await i18n.setLocalLang("english");
    const lines = [
      /Global Stats: express.*$/,
      /.*/,
      /Total of packages:.*17.*$/,
      /Total size:.*990.95 KB.*$/,
      /Packages with indirect dependencies:.*3.*$/,
      /.*/,
      /Extensions:.*$/,
      /\(16\) {2}- \(18\) \.js - \(18\) \.json - \(16\) \.md - \(7\) \.yml - \(1\) \.opts.*$/,
      /\(1\) .rej - \(1\) .markdown - \(1\) .types - \(2\) .html - \(2\) .css - \(1\) .txt - \(1\)$/,
      /.ico - \(1\) .png - \(1\) .dat$/,
      /.*/,
      /Licenses:.*$/,
      /\(5\) MIT*$/,
      /.*/
    ];
    t.plan(lines.length * 2);

    const processOptions = {
      path: kProcessPath,
      cwd: path.join(__dirname, "..", "fixtures")
    };

    for await (const line of runProcess(processOptions)) {
      const regexp = lines.shift();
      t.assert.ok(regexp, "we are expecting this line");
      t.assert.ok(regexp.test(stripVTControlCharacters(line)), `line (${line}) matches ${regexp}`);
    }
  });

  it("should not have dependencies", async(t) => {
    const expectedLines = [
      /Global Stats: express.*$/,
      /.*/,
      /Error:.*No dependencies.*$/,
      /.*/
    ];
    t.plan(expectedLines.length * 2);
    const processOptions = {
      path: kProcessPath.replace("summary.js", "summary-zero-dependencies.js"),
      cwd: path.join(__dirname, "..", "fixtures")
    };

    for await (const line of runProcess(processOptions)) {
      const expectedLineRegex = expectedLines.shift();
      const formattedLine = stripVTControlCharacters(line);
      t.assert.ok(expectedLineRegex, "we are expecting this line");
      t.assert.ok(expectedLineRegex.test(formattedLine), `line (${formattedLine}) should match ${expectedLineRegex}`);
    }
  });
});
