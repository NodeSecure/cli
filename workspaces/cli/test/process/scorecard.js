// Import Internal Dependencies
import * as scorecard from "../../src/commands/scorecard.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

prepareProcess(scorecard.main, ["fastify/fastify", { resolveOnVersionControl: true, vcs: "github" }]);
