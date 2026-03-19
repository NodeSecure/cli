// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import * as extractIntegrity from "../../../src/commands/extract-integrity.js";
import { prepareProcess } from "../../helpers/cliCommandRunner.js";

await i18n.getLocalLang();
await i18n.extendFromSystemPath(
  path.join(import.meta.dirname, "..", "..", "..", "i18n")
);

prepareProcess(extractIntegrity.main, [""]);
