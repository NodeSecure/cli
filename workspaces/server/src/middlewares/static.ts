// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import sirv from "sirv";

export interface AddStaticFilesOptions {
  projectRootDir: string;
}

export function addStaticFiles(options: AddStaticFilesOptions) {
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
