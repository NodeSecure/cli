// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import esbuild from "esbuild";
import {
  getBuildConfiguration
} from "@nodesecure/documentation-ui/node";

// CONSTANTS
export const PUBLIC_DIR = path.join(import.meta.dirname, "public");
export const OUTPUT_DIR = path.join(import.meta.dirname, "dist");
export const NODE_MODULES_DIR = path.join(import.meta.dirname, "node_modules");
export const IMAGES_DIR = path.join(PUBLIC_DIR, "img");

export function getSharedBuildOptions(): esbuild.BuildOptions {
  return {
    entryPoints: [
      path.join(PUBLIC_DIR, "main.js"),
      path.join(PUBLIC_DIR, "main.css"),
      path.join(NODE_MODULES_DIR, "highlight.js", "styles", "github.css"),
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
    outdir: OUTPUT_DIR
  };
}

export async function copyStaticAssets(): Promise<void> {
  const imagesFiles = await fs.readdir(IMAGES_DIR);

  await Promise.all([
    ...imagesFiles
      .map((name) => fs.copyFile(path.join(IMAGES_DIR, name), path.join(OUTPUT_DIR, name))),
    fs.copyFile(path.join(PUBLIC_DIR, "favicon.ico"), path.join(OUTPUT_DIR, "favicon.ico"))
  ]);
}
