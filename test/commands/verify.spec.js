import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";


// Import Third-party Dependencies
import tap from "tap";

// Import Internal Dependencies
import { VERIFY_EXPECTED_LINES } from "../fixtures/verifyExpectedStdout.js";
import { runProcess } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

tap.test("should execute verify command", async(tape) => {
  tape.plan(VERIFY_EXPECTED_LINES.length);

  for await (const line of runProcess({ path: path.join(kProcessDir, "verify.js") })) {
    const expectedLine = VERIFY_EXPECTED_LINES.shift();
    tape.equal(line.trimEnd(), expectedLine, `should be ${expectedLine}`);
  }

  tape.end();
});
