// Import Node.js Dependencies
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import * as extractIntegrity from "../../../src/commands/extract-integrity.js";
import { prepareProcess } from "../../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await i18n.getLocalLang();
await i18n.extendFromSystemPath(
  path.join(__dirname, "..", "..", "..", "i18n")
);

prepareProcess(extractIntegrity.main, ["express@4.17.1"]);
