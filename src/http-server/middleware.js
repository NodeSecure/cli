// Import Node.js Dependencies
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import sirv from "sirv";

// Import Internal Dependencies
import { context } from "./context.js";

export function buildContextMiddleware(dataFilePath) {
  return function addContext(_req, _res, next) {
    const store = { dataFilePath };
    context.run(store, next);
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const kProjectRootDir = join(__dirname, "..", "..");

export const addStaticFiles = sirv(join(kProjectRootDir, "dist"), { dev: true });
