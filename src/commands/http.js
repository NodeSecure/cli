// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import * as SemVer from "semver";
import kleur from "kleur";
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import { buildServer } from "../http-server/index.js";

// CONSTANTS
const kRequiredScannerRange = ">=5.1.0";

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
  assertScannerVersion(dataFilePath);

  const httpServer = buildServer(dataFilePath, {
    port: Number.isNaN(port) ? 0 : port
  });

  for (const eventName of ["SIGINT", "SIGTERM"]) {
    process.on(eventName, () => httpServer.server.close());
  }
}

function assertScannerVersion(
  dataFilePath
) {
  const rawStr = fs.readFileSync(dataFilePath, "utf-8");
  const { scannerVersion } = JSON.parse(rawStr);

  if (!SemVer.satisfies(scannerVersion, kRequiredScannerRange)) {
    const error = i18n.getTokenSync(
      "localI18n.startHttp.invalidScannerVersion",
      kleur.yellow(scannerVersion),
      kleur.yellow(kRequiredScannerRange)
    );
    const regenerate = i18n.getTokenSync("localI18n.startHttp.regenerate");

    console.log(" > " + path.basename(dataFilePath));
    console.log(" > " + kleur.red().bold(error));
    console.log(` > ${regenerate}`);
    console.log();

    process.exit(0);
  }
}
