// Import Node.js Dependencies
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

// Import Third-party Dependencies
import esbuild from "esbuild";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const kPublicDir = path.join(__dirname, "public");
const kOutDir = path.join(__dirname, "dist");
const kImagesDir = path.join(kPublicDir, "img");

await esbuild.build({
  entryPoints: [
    path.join(kPublicDir, "js", "master.js"),
    path.join(kPublicDir, "css", "style.css")
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

await Promise.all([
  ...["github-mark.png", "npm-icon.svg"]
    .map((name) => fs.copyFile(path.join(kImagesDir, name), path.join(kOutDir, name))),
  fs.copyFile(path.join(kPublicDir, "favicon.ico"), path.join(kOutDir, "favicon.ico"))
]);
