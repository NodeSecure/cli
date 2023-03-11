// Import Node.js Dependencies
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Import Third-party Dependencies
import esbuild from "esbuild";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const kMainDir = path.join(__dirname, "example");
const kOutDir = path.join(__dirname, "dist");

await esbuild.build({
  entryPoints: [
    path.join(kMainDir, "master.js"),
    path.join(__dirname, "src", "css", "main.css")
  ],
  platform: "browser",
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  outdir: kOutDir
});

fs.copyFileSync(path.join(kMainDir, "demo.html"), path.join(kOutDir, "index.html"));
