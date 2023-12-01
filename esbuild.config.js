// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import esbuild from "esbuild";
import { getBuildConfiguration } from "@nodesecure/documentation-ui/node";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const kPublicDir = path.join(__dirname, "public");
const kOutDir = path.join(__dirname, "dist");
const kImagesDir = path.join(kPublicDir, "img");
const kNodeModulesDir = path.join(__dirname, "node_modules");

await esbuild.build({
  entryPoints: [
    path.join(kPublicDir, "main.js"),
    path.join(kPublicDir, "main.css"),
    path.join(kNodeModulesDir, "highlight.js", "styles", "github.css"),
    ...getBuildConfiguration().entryPoints
  ],
  loader: {
    ".jpg": "file",
    ".png": "file",
    ".woff": "file",
    ".woff2": "file",
    ".eot": "file",
    ".ttf": "file",
    ".svg": "file"
  },
  platform: "browser",
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  outdir: kOutDir
});

const imagesFiles = await fs.readdir(kImagesDir);

await Promise.all([
  ...imagesFiles
    .map((name) => fs.copyFile(path.join(kImagesDir, name), path.join(kOutDir, name))),
  fs.copyFile(path.join(kPublicDir, "favicon.ico"), path.join(kOutDir, "favicon.ico"))
]);
