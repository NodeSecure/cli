// Import Internal Dependencies
import * as scorecard from "../../src/commands/scorecard.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

const kPackageName = process.argv[2];

prepareProcess(scorecard.main, [kPackageName]);
