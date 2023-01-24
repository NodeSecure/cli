// Import Node.js Dependencies
import { fileURLToPath } from "url";
import path from "path";
import { spawn } from "child_process";

// Import Third-party Dependencies
import test from "tape";
import splitByLine from "split2";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

test("scorecard should display fastify scorecard", async(tape) => {
  const fastifyScorecardToStrings = `
    OSSF Scorecard

    Repository                                                       fastify/fastify
    Scan at                                                               2022-11-28
    Score                                                                        5.2
    --------------------------------------------------------------------------------
    Maintained                                                                    10
    30 commit(s) out of 30 and 27 issue activity out of 30 found in the last 90
    days -- score normalized to 10

    Code-Review                                                                    8`.split("\n");

  tape.plan(fastifyScorecardToStrings.length);

  const child = spawn(process.execPath, [path.join(kProcessDir, "scorecard-fastify.js")], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });
  const rStream = child.stdout.pipe(splitByLine());

  let i = 0;
  for await (const line of rStream) {
    const expectedLine = fastifyScorecardToStrings[i++].trim();
    tape.equal(line.trim(), expectedLine, `line should be ${expectedLine}`);

    if (i === fastifyScorecardToStrings.length) {
      break;
    }
  }

  tape.teardown(() => child.kill());
  tape.end();
});

test("scorecard should retrieve repository from origin remote", async(tape) => {
  const CliScorecardToStrings = `
    OSSF Scorecard

    Repository                                                        NodeSecure/cli
    Scan at                                                               2023-01-23
    Score                                                                        8.6
    --------------------------------------------------------------------------------
    Binary-Artifacts                                                              10
    no binaries found in the repo

    Branch-Protection                                                              0`.split("\n");

  tape.plan(CliScorecardToStrings.length);

  const child = spawn(process.execPath, [path.join(kProcessDir, "scorecard-no-arg.js")], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });

  const rStream = child.stdout.pipe(splitByLine());

  let i = 0;
  for await (const line of rStream) {
    const expectedLine = CliScorecardToStrings[i++].trim();
    tape.equal(line.trim(), expectedLine, `line should be ${expectedLine}`);

    if (i === CliScorecardToStrings.length) {
      break;
    }
  }

  tape.teardown(() => child.kill());
  tape.end();
});

test("repository out the ossf scorecard public dataset", async(tape) => {
  tape.plan(1);

  const child = spawn(process.execPath, [path.join(kProcessDir, "scorecard-unknown.js")], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });
  const rStream = child.stdout.pipe(splitByLine());
  const expectedLine = "jjjjkkkk/llllmmmm is not part of the OSSF Scorecard BigQuery public dataset.";
  for await (const line of rStream) {
    tape.equal(line, expectedLine, `line should be ${expectedLine}`);
  }

  tape.teardown(() => child.kill());
  tape.end();
});
