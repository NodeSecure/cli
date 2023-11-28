// Import Node.js Dependencies
import path from "node:path";

// Import Internal Dependencies
import { buildServer } from "../http-server/index.js";

export async function start(
  payloadFileBasename = "nsecure-result.json",
  options = {}
) {
  const port = Number(options.port);
  const fileExtension = path.extname(payloadFileBasename);
  if (fileExtension !== ".json" && fileExtension !== "") {
    throw new Error("You must provide a JSON file (scanner payload) to open");
  }

  const dataFilePath = path.join(
    process.cwd(),
    fileExtension === "" ? `${payloadFileBasename}.json` : payloadFileBasename
  );

  const httpServer = buildServer(dataFilePath, {
    port: Number.isNaN(port) ? 0 : port
  });

  for (const eventName of ["SIGINT", "SIGTERM"]) {
    process.on(eventName, () => httpServer.server.close());
  }
}
