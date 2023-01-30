// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import test from "tape";

// Import Internal Dependencies
import { initCliRunner } from "../helpers/cliCommandRunner.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "scorecard.js");
const kOpenSSFScorecardRestApi = "https://api.securityscorecards.dev";

test("scorecard should display fastify scorecard", async(tape) => {
  const pkgName = "fastify/fastissssssssssssssfy";
  const mockBody = {
    date: "2222-12-31",
    repo: {
      name: `github.com/${pkgName}`,
      commit: "f4843b4fd9a35f187c931e7efe61ad17c94fe67a"
    },
    scorecard: {
      version: "v4.8.0-81-g28b116f",
      commit: "28b116f1a79f548b3b3bd595d8e379d0b7cadeaf"
    },
    score: 5.2,
    checks: [
      {
        name: "Maintained",
        score: 5.5,
        reason: "Package is maintassssssssssssssined"
      },
      {
        name: "2",
        score: 10,
        reason: `Package is maint2d
Package is maintazzzzzzzzzzzzzzzzzzzined`
      },
      {
        name: "3",
        score: 1,
        reason: "Package is maintas3ined"
      },
      {
        name: "sqdc",
        score: 0,
        reason: "Package is not maint4ned"
      }
    ]
  };
  const scorecardCliOptions = {
    path: kProcessPath,
    packageName: pkgName,
    api: {
      baseUrl: kOpenSSFScorecardRestApi,
      mustReturn404: false,
      response: { body: mockBody }
    }
  };

  const { forkAndGetLines: processScorecardAndParseStdout, mockApiOptions } = initCliRunner(scorecardCliOptions);
  const expectedLines = getExpectedScorecardLines(pkgName, mockApiOptions.response.body);
  const givenLines = await processScorecardAndParseStdout();

  tape.deepEqual(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

test("scorecard should retrieve repository from origin remote", async(tape) => {
  const expectedLines = [
    "",
    "                                 OSSF Scorecard",
    "",
    "Repository                                                        nodesecure/cli",
    "Scan at                                                               2222-12-31",
    "Score                                                                        5.2",
    "--------------------------------------------------------------------------------",
    "Maintained                                                                    10",
    "Package is maintained",
    ""
  ];
  tape.plan(CliScorecardToStrings.length);

  const rStream = child.stdout.pipe(splitByLine());

  let i = 0;
  for await (const line of rStream) {
    const expectedLine = CliScorecardToStrings[i++].trim();
    tape.equal(line.trim(), expectedLine, `line should be ${expectedLine}`);

    if (i === CliScorecardToStrings.length) {
      break;
    }
  }

  tape.end();
});

// test("repository out the ossf scorecard public dataset", async(tape) => {
//   tape.plan(1);

//   const child = getChildProcess();
//   const rStream = child.stdout.pipe(splitByLine());
//   const expectedLine = "jjjjkkkk/llllmmmm is not part of the OSSF Scorecard BigQuery public dataset.";
//   for await (const line of rStream) {
//     tape.equal(line, expectedLine, `line should be ${expectedLine}`);
//   }

//   tape.teardown(() => child.kill());
//   tape.end();
// });
