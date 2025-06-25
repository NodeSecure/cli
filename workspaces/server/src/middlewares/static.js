// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import sirv from "sirv";

export function addStaticFiles(options) {
  const {
    projectRootDir
  } = options;

  return sirv(
    path.join(projectRootDir, "dist"),
    {
      dev: true
    }
  );
}
