// Import Internal Dependencies
import * as scorecard from "../../src/commands/scorecard.js";
import { runCliCommand } from "../helpers/cliCommandRunner.js";

const kPackageName = process.argv[2];

runCliCommand(scorecard.main, [kPackageName]);
