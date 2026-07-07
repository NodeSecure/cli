// Import Internal Dependencies
import * as verify from "../../src/commands/verify.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

function mockVerify() {
  return ({ foo: "bar" });
}

prepareProcess(verify.main, ["myawesome/package", { json: true }, mockVerify]);
