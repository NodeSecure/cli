// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import tap from "tap";
import esmock from "esmock";
import { API_URL } from "@nodesecure/ossf-scorecard-sdk";

// Import Internal Dependencies
import { initCliRunner } from "../helpers/cliCommandRunner.js";
import { getExpectedScorecardLines } from "../helpers/utils.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");
const kProcessPath = path.join(kProcessDir, "scorecard.js");

tap.test("scorecard should display fastify scorecard", async(tape) => {
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
      baseUrl: API_URL,
      shouldFail: false,
      response: { body: mockBody }
    }
  };

  const { mockAndGetLines, mockApiOptions } = initCliRunner(scorecardCliOptions);
  const expectedLines = getExpectedScorecardLines(pkgName, mockApiOptions.response.body);
  const givenLines = await mockAndGetLines();

  tape.same(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

tap.test("should not display scorecard for unknown repository", async(tape) => {
  const packageName = "unkown/repository";
  const scorecardCliOptions = {
    path: kProcessPath,
    packageName,
    api: {
      baseUrl: API_URL,
      shouldFail: true
    }
  };

  const { mockAndGetLines } = initCliRunner(scorecardCliOptions);
  const expectedLines = [
    `${packageName} is not part of the OSSF Scorecard BigQuery public dataset.`
  ];
  const givenLines = await mockAndGetLines();

  tape.same(givenLines, expectedLines, `lines should be ${expectedLines}`);
  tape.end();
});

tap.test("should retrieve repository whithin git config", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: { readFileSync: () => `
[remote "origin"]
  url = git@github.com:myawesome/repository.git
  fetch = +refs/heads/*:refs/remotes/origin/*
` } });
  tape.same(testingModule.getCurrentRepository(), { ok: true, reason: null, value: "myawesome/repository" });
  tape.end();
});

tap.test("should not find origin remote", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: { readFileSync: () => "just one line" }
  });
  const result = testingModule.getCurrentRepository();
  tape.equal(result.ok, false);
  tape.equal(result.reason, "Cannot find origin remote.");
});

tap.test("should support github only", async(tape) => {
  const testingModule = await esmock("../../src/commands/scorecard.js", {
    fs: { readFileSync: () => `
[remote "origin"]
  url = git@gitlab.com:gitlab/repository.git
  fetch = +refs/heads/*:refs/remotes/origin/*
` } });
  const result = testingModule.getCurrentRepository();
  tape.equal(result.ok, false);
  tape.equal(result.reason, "OSSF Scorecard supports projects hosted on Github only.");
});
