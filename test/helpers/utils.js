export function getExpectedScorecardLines(pkgName, body) {
  const { date, score: scorePkg, checks } = body;

  const expectedLines = [
    "",
    "                                 OSSF Scorecard",
    "",
    mockScorecardCliLine("Repository", pkgName),
    mockScorecardCliLine("Scan at", date),
    mockScorecardCliLine("Score", scorePkg),
    "--------------------------------------------------------------------------------"
  ];

  for (const { name, score, reason } of checks) {
    const reasonLines = reason.split("\n");
    const lines = [mockScorecardCliLine(name, !score || score < 0 ? 0 : score), ...reasonLines, ""];

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

export async function arrayFromAsync(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk.toString("utf8"));
    }
    else {
      chunks.push(chunk);
    }
  }

  return chunks;
}
