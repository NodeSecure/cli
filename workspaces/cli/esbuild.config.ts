// Import Third-party Dependencies
import esbuild from "esbuild";

// Import Internal Dependencies
import {
  getSharedBuildOptions,
  copyStaticAssets
} from "./esbuild.common.ts";

await esbuild.build(getSharedBuildOptions());
await copyStaticAssets();
