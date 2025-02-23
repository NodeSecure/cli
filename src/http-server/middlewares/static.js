// Import Node.js Dependencies
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import sirv from "sirv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProjectRootDir = path.join(__dirname, "..", "..", "..");

export const addStaticFiles = sirv(
  path.join(kProjectRootDir, "dist"),
  { dev: true }
);
