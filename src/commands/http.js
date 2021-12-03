// Import Node.js Dependencies
import path from "path";

// Import Internal Dependencies
import { buildServer } from "../http-server/index.js";

export async function start(json = "nsecure-result.json", options = {}) {
  const port = Number(options.port);
  const dataFilePath = path.join(process.cwd(), json);

  const httpServer = buildServer(dataFilePath, {
    port: Number.isNaN(port) ? 0 : port
  });

  for (const eventName of ["SIGINT", "SIGTERM"]) {
    process.on(eventName, () => httpServer.server.close());
  }
}
