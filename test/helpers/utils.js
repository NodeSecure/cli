import { normalizeScore } from "../../src/commands/scorecard";

export function getExpectedScorecardLines(pkgName, body) {
  const { date, score: scorePkg, checks } = body;

  const startOfLines = [
    "",
    "                                 OSSF Scorecard",
    "",
    mockScorecardCliLine("Repository", pkgName),
    mockScorecardCliLine("Scan at", date),
    mockScorecardCliLine("Score", scorePkg),
    "--------------------------------------------------------------------------------"
  ];

  const expectedLines = [
    ...startOfLines
  ];

  for (const { name, score, reason } of checks) {
    const reasonLines = reason.split("\n");
    const lines = [mockScorecardCliLine(name, normalizeScore(score)), ...reasonLines, ""];

    expectedLines.push(...lines);
  }

  return expectedLines;
}

function mockScorecardCliLine(str, rawValue) {
  if (typeof rawValue === "undefined") {
    return str;
  }

  const value = String(rawValue);

  return `${str.padEnd(80 - value.length, " ")}${value}`;
}
