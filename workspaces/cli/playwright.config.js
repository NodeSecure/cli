// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";

// Import Third-party Dependencies
import { defineConfig } from "@playwright/test";

// CONSTANTS
const kE2ECachePath = path.join(os.tmpdir(), "nsecure-e2e-payloads");

export default defineConfig({
  testDir: "./test/e2e",
  globalTeardown: "./test/e2e/global-teardown.js",
  use: {
    baseURL: "http://localhost:3000"
  },
  webServer: {
    command: "node . open ./test/e2e/fixtures/nsecure-result.json --port 3000 --ws-port 1339",
    env: {
      NODESECURE_NO_OPEN: true,
      NODESECURE_PAYLOADS_PATH: kE2ECachePath
    },
    port: 3000,
    timeout: 15_000
  }
});
