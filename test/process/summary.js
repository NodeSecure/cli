// Import Node.js Dependencies
import path from "node:path";
import url from "node:url";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

// Import Internal Dependencies
import * as summary from "../../src/commands/summary.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

await i18n.getLocalLang();
await i18n.extendFromSystemPath(
  path.join(__dirname, "..", "..", "i18n")
);

prepareProcess(summary.main, ["result-test1.json"]);
