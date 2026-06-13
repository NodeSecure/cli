// Import Node.js Dependencies
import assert from "node:assert";
import { fork } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";

// CONSTANTS
const kProcessPath = path.join(import.meta.dirname, "..", "process", "check-and-run.js");

describe("bin/check-and-run.js", () => {
  it("should exit with code 1 and print a friendly message for an unsupported Node version", async() => {
    const { exitCode, stderr } = await runSubprocess("0.10.0");

    assert.strictEqual(exitCode, 1, "should exit with code 1");
    assert.ok(
      stderr.includes("@nodesecure/cli requires Node.js"),
      "should print required Node.js version message"
    );
  });

  it("should pass the version gate when Node version satisfies engines range", async() => {
    const { stderr } = await runSubprocess("24.0.0");

    assert.ok(
      !stderr.includes("@nodesecure/cli requires Node.js"),
      "should not print a version mismatch message"
    );
  });
});

function runSubprocess(version) {
  return new Promise((resolve) => {
    const child = fork(kProcessPath, [version], {
      stdio: ["ignore", "pipe", "pipe", "ipc"]
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (code) => {
      resolve({ exitCode: code, stderr });
    });
  });
}
