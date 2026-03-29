// Import Third-party Dependencies
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  use: {
    baseURL: "http://localhost:3000"
  },
  webServer: {
    command: "node . open ./test/e2e/fixtures/nsecure-result.json --port 3000 --ws-port 1339",
    env: { NODESECURE_NO_OPEN: true },
    port: 3000,
    timeout: 15_000
  }
});
