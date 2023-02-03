import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";


// Import Third-party Dependencies
import tap from "tap";
import splitByLine from "split2";
import stripAnsi from "strip-ansi";

// Import Internal Dependencies
import { VERIFY_EXPECTED_LINES } from "../fixtures/verifyExpectedStdout.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

tap.test("should execute verify command", async(tape) => {
  tape.plan(VERIFY_EXPECTED_LINES.length);

  const child = spawn(process.execPath, [path.join(kProcessDir, "verify.js")], {
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  tape.teardown(() => child.kill());

  const rStream = child.stdout.pipe(splitByLine());
  let i = 0;
  for await (const line of rStream) {
    const expectedLine = VERIFY_EXPECTED_LINES[i++];
    tape.equal(stripAnsi(line).trimEnd(), expectedLine, `should be ${expectedLine}`);
  }

  tape.end();
});
