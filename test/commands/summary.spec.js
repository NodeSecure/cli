// Import Node.js Dependencies
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

// Import Third-party Dependencies
import test from "tape";
import splitByLine from "split2";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

test("summary should execute summary command on fixtures 'result-test1.json'", async(tape) => {
  const lines = [
    /Global Stats: express.*$/,
    /.*/,
    /Total of packages:.*64.*$/,
    /Total size:.*1.62 MB.*$/,
    /Packages with indirect dependencies:.*5.*$/,
    /.*/,
    /Extensions:.*$/,
    /\(48\) {2}- \(50\) \.md - \(50\) \.js - \(50\) \.json - \(2\) \.yml - \(5\) \.ts.*$/,
    /.*/,
    /Licenses:.*$/,
    /\(47\) MIT - \(2\) ISC.*$/,
    /.*/
  ];

  const child = spawn(process.execPath, [path.join(kProcessDir, "run-summary.js"), "result-test1.json"], {
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

test("summary should throw on fixtures 'result-without-version.json'", async(tape) => {
  const lines = [
    /.*/,
    /throw new Error\(`/,
    /.*/,
    /.*/,
    /Error:/,
    /Your analysis version is no more compatible with nsecure \(accepted range: >=3.0.0\) - Run a new analysis./,
    /.*/,
    /.*/,
    /.*/,
    /.*/,
    /.*/
  ];

  const child = spawn(process.execPath, [path.join(kProcessDir, "run-summary.js"), "result-without-version.json"], {
    cwd: path.join(__dirname, "..", "fixtures"),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });
  tape.teardown(() => child.kill());

  const rStream = child.stderr.pipe(splitByLine());
  for await (const line of rStream) {
    const regexp = lines.shift();

    tape.ok(regexp, "we are expecting this line");
    tape.ok(regexp.test(line), `line matches ${regexp}`);
  }

  tape.end();
});

test("summary should throw on fixtures 'summary-with-bad-version-range.json'", async(tape) => {
  const lines = [
    /.*/,
    /throw new Error\(`/,
    /.*/,
    /.*/,
    /Error:/,
    /Your analysis version is no more compatible with nsecure \(accepted range: >=3.0.0\) - Run a new analysis./,
    /.*/,
    /.*/,
    /.*/,
    /.*/,
    /.*/
  ];

  const child = spawn(process.execPath, [path.join(kProcessDir, "run-summary.js"), "result-with-bad-version-range.json"], {
    cwd: path.join(__dirname, "..", "fixtures"),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });
  tape.teardown(() => child.kill());

  const rStream = child.stderr.pipe(splitByLine());
  for await (const line of rStream) {
    const regexp = lines.shift();
    console.log(line);

    tape.ok(regexp, "we are expecting this line");
    tape.ok(regexp.test(line), `line matches ${regexp}`);
  }

  tape.end();
});
