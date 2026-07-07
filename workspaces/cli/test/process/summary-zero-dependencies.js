// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import * as summary from "../../src/commands/summary.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

await i18n.getLocalLang();
await i18n.extendFromSystemPath(
  path.join(import.meta.dirname, "..", "..", "i18n")
);

prepareProcess(summary.main, ["result-test2.json"]);
