// Import Node.js Dependencies
import path from "node:path";

export function getBuildConfiguration() {
  return {
    entryPoints: [
      path.join(import.meta.dirname, "..", "css", "main.css")
    ]
  };
}
