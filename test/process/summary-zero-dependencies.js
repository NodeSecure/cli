// Import Internal Dependencies
import * as summary from "../../src/commands/summary.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

prepareProcess(summary.main, ["result-test2.json"]);
