// Import Node.js Dependencies
import path from "path";

// Import Internal Dependencies
import { startHTTPServer } from "../httpServer.js";

export async function start(json = "nsecure-result.json", options = {}) {
  const { port } = options;

  const dataFilePath = path.join(process.cwd(), json);
  const configPort = Number.isNaN(Number(port)) ? 0 : Number(port);
  const httpServer = await startHTTPServer(dataFilePath, configPort);

  for (const eventName of ["SIGINT", "SIGTERM"]) {
    process.on(eventName, () => httpServer.server.close());
  }
}
