// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import { defineConfig } from "vite";
import { getManifest } from "@nodesecure/flags";

export default defineConfig({
  root: "example",
  define: {
    FLAGS: JSON.stringify(getManifest())
  },
  server: {
    open: "/demo.html"
  },
  build: {
    outDir: "../dist",
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "example/demo.html")
    }
  }
});
