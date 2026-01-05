// Load .env file if it exists (quiet - no error if missing)
try {
  process.loadEnvFile();
}
catch {
  // .env file not found or not readable - ignore silently
}

// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

// Import Internal Dependencies
import { runProcess } from "../helpers/cliCommandRunner.js";
import { arrayFromAsync } from "../helpers/utils.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

describe("CLI Commands: extract integrity", () => {
  test("should not find an integrity diff", async() => {
    const expectedLine = "no integrity diff found";

    const lines = await arrayFromAsync(runProcess({ path: path.join(kProcessDir, "extract-integrity/valid-spec.js") }));

    assert.equal(lines[0], expectedLine, `should be ${expectedLine}`);
  });

  test("should not check integrity if version is missing", async() => {
    const expectedLine = " [!] You must specify a version for 'express' package.";

    const lines = await arrayFromAsync(runProcess({ path: path.join(kProcessDir, "extract-integrity/missing-version.js") }));

    assert.equal(lines[0], expectedLine, `should be ${expectedLine}`);
  });

  test("should not check integrity for invalid spec", async() => {
    const expectedLine = " [!] The package spec '' is invalid.";

    const lines = await arrayFromAsync(runProcess({ path: path.join(kProcessDir, "extract-integrity/invalid-spec.js") }));

    assert.equal(lines[0], expectedLine, `should be ${expectedLine}`);
  });

  test("should not check integrity if spec is not found", async() => {
    const expectedLine = " [!] The package spec 'express@not-found' could not be found from the npm registry.";

    const lines = await arrayFromAsync(runProcess({ path: path.join(kProcessDir, "extract-integrity/not-found.js") }));

    assert.equal(lines[0], expectedLine, `should be ${expectedLine}`);
  });
});
