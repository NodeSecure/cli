#!/usr/bin/env node

// Import Third-party Dependencies
import semver from "semver";

const { default: packageJSON } = await import("../package.json", {
  with: { type: "json" }
});

const currentVersion = process.versions.node;
const requiredRange = packageJSON.engines?.node ?? null;
if (requiredRange === null) {
  throw new Error("Missing 'engines.node' field in package.json");
}

if (!semver.satisfies(currentVersion, requiredRange)) {
  console.error(
    `\n  @nodesecure/cli requires Node.js ${requiredRange}.` +
    `\n  Current version: v${currentVersion}\n`
  );
  process.exit(1);
}

await import(
  "./index.js"
);
