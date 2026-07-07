// Import Third-party Dependencies
import { Extractors } from "@nodesecure/scanner/extractors";

// Import Internal Dependencies
import { getScanFromFile } from "../utils/getScanFromFile.js";
import { logAndWrite, logError } from "./loggers/logger.js";
import { parseContacts } from "./parsers/contacts.js";
import { parsePackages } from "./parsers/packages.js";

export async function main(options) {
  const { getScanResult = getScanFromFile, logger = {
    logAndWrite,
    logError
  }, contacts, packages, output
  } = options;
  try {
    const scanResult = await getScanResult(output);

    const extractor = new Extractors.Payload(scanResult, [
      new Extractors.Probes.HighlightedContacts(parseContacts(contacts)),
      new Extractors.Probes.HighlightedPackages(parsePackages(packages))
    ]);

    const {
      highlightedPackages,
      illuminated
    } = extractor.extractAndMerge();

    await logger.logAndWrite({
      ...scanResult,
      highlighted: {
        ...scanResult.highlighted,
        contacts: illuminated,
        packages: highlightedPackages
      }
    }, output, { showWarnings: false });
  }
  catch {
    logger.logError("cli.commands.reHighlight.error");
  }
}
