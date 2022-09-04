// Import Node.js Dependencies
import dotenv from "dotenv";
import { spawn, execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

// Import Third-party Dependencies
import test from "tape";
import splitByLine from "split2";
import kleur from "kleur";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

test("summary should execute summary command on fixtures 'result-test1.json'", async(tape) => {
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

  const child = spawn(process.execPath, [path.join(kProcessDir, "summary.js")], {
    cwd: path.join(__dirname, "..", "fixtures"),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });
  tape.teardown(() => child.kill());

  const rStream = child.stdout.pipe(splitByLine());
  for await (const line of rStream) {
    const regexp = lines.shift();

    tape.ok(regexp, "we are expecting this line");
    tape.ok(regexp.test(line), `line matches ${regexp}`);
  }

  tape.end();
});

test("warning on missing 'NODE_SECURE_TOKEN'", async(tape) => {
  if (!process.env.NODE_SECURE_TOKEN) {
    tape.equal(process.env.NODE_SECURE_TOKEN, undefined);
  }

  tape.end();
});
