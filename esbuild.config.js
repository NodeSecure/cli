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
const kImageExt = new Set([".png", ".svg"]);
const kFontExt = new Set([".woff", ".ttf", ".woff2", ".eot"]);

// Items to import
const imagesToCopy = ["github-mark.png", "npm-icon.svg"];

async function main() {
  await fs.mkdir(path.join(kOutDir, "img"), { recursive: true });

  const buildOptions = {
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
  };
  await Promise.all([
    esbuild.build(buildOptions),
    ...imagesToCopy.map((name) => fs.copyFile(path.join(kImagesDir, name), path.join(kOutDir, name)))
  ]);

  const toWaitPromises = [
    fs.copyFile(path.join(kPublicDir, "favicon.ico"), path.join(kOutDir, "favicon.ico"))
  ];
  const dirents = await fs.readdir(kOutDir, { withFileTypes: true });
  for (const dirent of dirents) {
    const ext = path.extname(dirent.name);
    const fullPath = path.join(kOutDir, dirent.name);

    if (kImageExt.has(ext)) {
      const promise = fs.rename(fullPath, path.join(kOutDir, "img", dirent.name));
      toWaitPromises.push(promise);
    }
    else if (kFontExt.has(ext)) {
      const promise = fs.rename(fullPath, path.join(kOutDir, "css", dirent.name));
      toWaitPromises.push(promise);
    }
  }

  await Promise.all(toWaitPromises);
}
main().catch(() => process.exit(1));
