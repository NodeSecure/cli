import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import tap from "tap";
import stripAnsi from "strip-ansi";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { runProcess } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "summary.js");

tap.test("summary should execute summary command on fixtures 'result-test1.json'", async(tape) => {
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
  tape.plan(lines.length * 2);

  const processOptions = {
    path: kProcessPath,
    cwd: path.join(__dirname, "..", "fixtures")
  };

  for await (const line of runProcess(processOptions)) {
    const regexp = lines.shift();
    tape.ok(regexp, "we are expecting this line");
    tape.ok(regexp.test(stripAnsi(line)), `line (${line}) matches ${regexp}`);
  }

  tape.end();
});
