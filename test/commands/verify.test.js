import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { VERIFY_EXPECTED_LINES } from "../fixtures/verifyExpectedStdout.js";
import { runProcess } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kExpectVerifyJson = `{
  "foo": "bar"
}`.split("\n");
test("should execute verify command", async() => {
  for await (const line of runProcess({ path: path.join(kProcessDir, "verify.js") })) {
    const expectedLine = VERIFY_EXPECTED_LINES.shift();
    assert.equal(line.trimEnd(), expectedLine, `should be ${expectedLine}`);
  }
});

test("should execute verify command with json option", async() => {
  for await (const line of runProcess({ path: path.join(kProcessDir, "verify-json.js") })) {
    const expectedLine = kExpectVerifyJson.shift();
    assert.equal(line.trimEnd(), expectedLine, `should be ${expectedLine}`);
  }
});
