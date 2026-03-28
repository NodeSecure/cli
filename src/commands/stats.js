// Import Node.js Dependencies
import { readFile } from "node:fs/promises";
import path from "node:path";

// Import Internal Dependencies
import { logScannerStat, logScannerError, log, logError, formatMs } from "./loggers/logger.js";

export async function main(options) {
  const { getScanResult = getScanFromFile, logger = {
    logScannerStat,
    logScannerError,
    log,
    logError
  } } = options;
  try {
    const scanResult = await getScanResult();
    const { metadata } = scanResult;

    logger.log("cli.commands.stats.elapsed", formatMs(metadata.executionTime));
    logger.log("cli.commands.stats.stats", metadata.apiCallsCount);
    metadata.apiCalls.forEach((call) => {
      logger.logScannerStat(call, false);
    });
    if (metadata.errorCount === 0) {
      return;
    }
    logger.log("cli.commands.stats.errors", metadata.errorCount);
    metadata.errors.forEach((error) => {
      logger.logScannerError(error);
    });
  }
  catch {
    logger.logError("cli.commands.stats.error");
  }
}

async function getScanFromFile() {
  const projectRootDir = path.join(import.meta.dirname, "..", "..");
  const filePath = path.join(projectRootDir, "nsecure-result.json");

  return JSON.parse(await readFile(filePath, "utf8"));
}
