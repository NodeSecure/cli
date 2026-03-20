// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";

// Import Third-party Dependencies
import esbuild from "esbuild";
import { getManifest } from "@nodesecure/flags";

// CONSTANTS
const kMainDir = path.join(import.meta.dirname, "example");
const kOutDir = path.join(import.meta.dirname, "dist");

await esbuild.build({
  entryPoints: [
    path.join(kMainDir, "master.js")
  ],
  platform: "browser",
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  outdir: kOutDir,
  define: {
    FLAGS: JSON.stringify(getManifest())
  }
});

fs.copyFileSync(path.join(kMainDir, "demo.html"), path.join(kOutDir, "index.html"));
