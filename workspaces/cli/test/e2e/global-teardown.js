// Import Node.js Dependencies
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export default async function globalTeardown() {
  await fs.rm(
    path.join(os.tmpdir(), "nsecure-e2e-payloads"),
    { recursive: true, force: true }
  );
}
