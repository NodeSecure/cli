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

await esbuild.build({
  entryPoints: [
    path.join(kPublicDir, "js", "master.js"),
    path.join(kPublicDir, "css", "style.css"),
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

await Promise.all([
  ...[
    "github-mark.png",
    "github-black.png",
    "npm-icon.svg",
    "node.png",
    "snyk.png",
    "sonatype.png",
    "avatar-default.png",
    "ext-link.svg"
  ].map((name) => fs.copyFile(path.join(kImagesDir, name), path.join(kOutDir, name))),
  fs.copyFile(path.join(kPublicDir, "favicon.ico"), path.join(kOutDir, "favicon.ico"))
]);
