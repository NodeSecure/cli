// Import Internal Dependencies
import * as verify from "../../src/commands/verify.js";
import { prepareProcess } from "../helpers/cliCommandRunner.js";

function mockVerify(packageName) {
  return ({
    files: {
      list: ["index.js", "package.json"],
      extensions: [".js", ".json"],
      minified: ["index.min.js"]
    },
    directorySize: 2048,
    uniqueLicenseIds: ["MIT"],
    ast: {
      dependencies: {
        "index.js": {
          "node:os": {
            unsafe: false,
            inTry: false,
            location: {
              start: {
                line: 2,
                column: 0
              },
              end: {
                line: 2,
                column: 34
              }
            }
          }
        }
      },
      warnings: [
        {
          kind: "suspicious-literal",
          location: [[4, 1], [4, 8]],
          value: 5.268656716417911,
          i18n: "sast_warnings.suspicious_literal",
          severity: "Warning",
          file: "index.js"
        }
      ]
    }
  });
}

prepareProcess(verify.main, ["myawesome/package", {}, mockVerify]);
