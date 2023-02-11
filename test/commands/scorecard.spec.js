// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import tap from "tap";
import esmock from "esmock";
import { API_URL } from "@nodesecure/ossf-scorecard-sdk";
import { Ok } from "@openally/result";

// Import Internal Dependencies
import { runProcess } from "../helpers/cliCommandRunner.js";
import { arrayFromAsync, getExpectedScorecardLines } from "../helpers/utils.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "scorecard.js");

tap.test("scorecard should display fastify scorecard", async(tape) => {
  const packageName = "fastify/fastify";
  const mockBody = {
    date: "2222-12-31",
    repo: {
      name: `github.com/${packageName}`
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
    args: [packageName],
    undiciMockAgentOptions: {
      baseUrl: API_URL,
      intercept: {
        path: `/projects/github.com/${packageName}`,
        method: "GET"
      },
      response: {
        body: mockBody,
        status: 200
      }
    }
  };

  const givenLines = await arrayFromAsync(runProcess(scorecardCliOptions));
  const expectedLines = getExpectedScorecardLines(packageName, mockBody);

  tape.same(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

tap.test("should not display scorecard for unknown repository", async(tape) => {
  const packageName = "unkown/repository";
  const scorecardCliOptions = {
    path: kProcessPath,
    args: [packageName],
    undiciMockAgentOptions: {
      baseUrl: API_URL,
      intercept: {
        path: `/projects/github.com/${packageName}`,
        method: "GET"
      },
      response: {
        body: {},
        status: 500
      }
    }
  };

  const expectedLines = [
    `${packageName} is not part of the OSSF Scorecard BigQuery public dataset.`
  ];
  const givenLines = await arrayFromAsync(runProcess(scorecardCliOptions));

  tape.same(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

tap.test("should retrieve repository whithin git config", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: {
      readFileSync: () => [
        "[remote \"origin\"]",
        "\turl = git@github.com:myawesome/repository.git"
      ].join("\n")
    }
  });
  tape.same(testingModule.getCurrentRepository(), Ok("myawesome/repository"));
  tape.end();
});

tap.test("should not find origin remote", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: {
      readFileSync: () => "just one line"
    }
  });
  const result = testingModule.getCurrentRepository();
  tape.equal(result.err, true);
  tape.equal(result.val, "Cannot find origin remote.");
});

tap.test("should support github only", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: {
      readFileSync: () => [
        "[remote \"origin\"]",
        "\turl = git@gitlab.com:myawesome/repository.git"
      ].join("\n")
    }
  });
  const result = testingModule.getCurrentRepository();
  tape.equal(result.err, true);
  tape.equal(result.val, "OSSF Scorecard supports projects hosted on Github only.");
});
