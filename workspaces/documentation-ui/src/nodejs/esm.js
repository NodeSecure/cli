// Import Node.js Dependencies
import { fileURLToPath } from "url";
import path from "path";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getBuildConfiguration() {
  return {
    entryPoints: [
      path.join(__dirname, "..", "css", "main.css")
    ]
  };
}
