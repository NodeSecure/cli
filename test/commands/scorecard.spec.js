// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import test from "tape";

// Import Internal Dependencies
import { initCliRunner } from "../helpers/cliCommandRunner.js";
import { getExpectedScorecardLines } from "../helpers/utils.js";
import { getCurrentRepository } from "../../src/commands/scorecard.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "scorecard.js");
const kOpenSSFScorecardRestApi = "https://api.securityscorecards.dev";

test("scorecard should display fastify scorecard", async(tape) => {
  const pkgName = "fastify/fastify";
  const mockBody = {
    date: "2222-12-31",
    repo: {
      name: `github.com/${pkgName}`
    },
    score: 5.2,
    checks: [
      {
        name: "Maintained",
        score: -1,
        reason: "Package is maintained"
      }
    ]
  };
  const scorecardCliOptions = {
    path: kProcessPath,
    packageName: pkgName,
    api: {
      baseUrl: kOpenSSFScorecardRestApi,
      shouldFail: false,
      response: { body: mockBody }
    }
  };

  const { mockAndGetLines, mockApiOptions } = initCliRunner(scorecardCliOptions);
  const expectedLines = getExpectedScorecardLines(pkgName, mockApiOptions.response.body);
  const givenLines = await mockAndGetLines();

  tape.deepEqual(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

test("should not display scorecard for unknown repository", async(tape) => {
  const packageName = "unkown/repository";
  const scorecardCliOptions = {
    path: kProcessPath,
    packageName,
    api: {
      baseUrl: kOpenSSFScorecardRestApi,
      shouldFail: true
    }
  };

  const { mockAndGetLines } = initCliRunner(scorecardCliOptions);
  const expectedLines = [
    `${packageName} is not part of the OSSF Scorecard BigQuery public dataset.`
  ];
  const givenLines = await mockAndGetLines();

  tape.deepEqual(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

test("should retrieve repository whithin git config", async(tape) => {
  tape.deepEqual(getCurrentRepository(), { ok: true, reason: null, value: "NodeSecure/cli" });
  tape.end();
});
