// Import Node.js Dependencies
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import {
  buildServer,
  cache,
  logger,
  WebSocketServerInstanciator
} from "@nodesecure/server";
import open from "open";
import * as SemVer from "semver";

// Import Internal Dependencies
import english from "../../i18n/english.js";
import french from "../../i18n/french.js";
import kleur from "../utils/styleText.js";

// CONSTANTS
const kRequiredScannerRange = ">=5.1.0";
const kProjectRootDir = path.join(import.meta.dirname, "..", "..");
const kComponentsDir = path.join(kProjectRootDir, "public", "components");

export async function start(
  payloadFileBasename = "nsecure-result.json",
  options = {}
) {
  const port = Number(options.port);
  const httpPort = Number.isNaN(port) ? 0 : port;
  const freshStart = Boolean(options.f);
  const enableDeveloperMode = Boolean(options.developer);

  const fileExtension = path.extname(payloadFileBasename);
  if (fileExtension !== ".json" && fileExtension !== "") {
    throw new Error("You must provide a JSON file (scanner payload) to open");
  }

  const dataFilePath = path.join(
    process.cwd(),
    fileExtension === "" ? `${payloadFileBasename}.json` : payloadFileBasename
  );
  const dataFilePathExists = fs.existsSync(dataFilePath);
  const runFromPayload = dataFilePathExists && freshStart === false;
  if (runFromPayload) {
    assertScannerVersion(dataFilePath);
  }
  else {
    cache.prefix = crypto.randomBytes(4).toString("hex");
  }

  if (enableDeveloperMode) {
    // todo: ping/warn if dev server is not up & running
    open("http://127.0.0.1:8080");
  }
  else {
    const httpServer = buildServer(dataFilePath, {
      port: httpPort,
      hotReload: enableDeveloperMode,
      runFromPayload,
      projectRootDir: kProjectRootDir,
      componentsDir: kComponentsDir,
      i18n: {
        english,
        french
      }
    });

    httpServer.listen(httpPort, async() => {
      const link = `http://localhost:${httpServer.address().port}`;
      console.log(kleur.magenta().bold(await i18n.getToken("cli.http_server_started")), kleur.cyan().bold(link));

      open(link);
    });

    new WebSocketServerInstanciator({
      cache,
      logger
    });

    for (const eventName of ["SIGINT", "SIGTERM"]) {
      process.on(eventName, () => {
        httpServer.close();

        console.log(kleur.red().bold(`${eventName} signal received.`));
        process.exit(0);
      });
    }
  }
}

function assertScannerVersion(
  dataFilePath
) {
  const rawStr = fs.readFileSync(dataFilePath, "utf-8");
  const { scannerVersion } = JSON.parse(rawStr);

  if (!SemVer.satisfies(scannerVersion, kRequiredScannerRange)) {
    const error = i18n.getTokenSync(
      "cli.startHttp.invalidScannerVersion",
      kleur.yellow(scannerVersion),
      kleur.yellow(kRequiredScannerRange)
    );
    const regenerate = i18n.getTokenSync("cli.startHttp.regenerate");

    console.log(" > " + path.basename(dataFilePath));
    console.log(" > " + kleur.red().bold(error));
    console.log(` > ${regenerate}`);
    console.log();

    process.exit(0);
  }
}
