// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fork } from "node:child_process";
import { createInterface } from "node:readline";

// Import Third-party Dependencies
import { MockAgent, setGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { getCurrentRepository } from "../../src/commands/scorecard.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kScorecardPath = path.join(__dirname, "..", "process", "scorecard.js");
const kOpenSSFScorecardRestApi = "https://api.securityscorecards.dev";
// const kDefaultPlatform = "github.com";

async function getChildProcess(options) {
  const packageName = options.packageName || await getCurrentRepository();
  const apiReturns404 = Boolean(options.api?.isUnknown);
  const mockPkgName = apiReturns404 ? null : packageName;
  const mockOptions = options.api?.baseUrl ? buildOptions(mockPkgName, options.api?.baseUrl) : null;
  const args = packageName ? [packageName] : [];

  const childProcess = fork(options.path, args, {
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });

  childProcess.send(mockOptions);

  return childProcess;
}

export async function forkAndGetLines(options) {
  const child = await getChildProcess(options);
  const rStream = createInterface(child.stdout);
  const lines = [];

  for await (const line of rStream) {
    lines.push(line);
  }

  child.kill();

  return lines;
}

export async function runCliCommand(cb, args = []) {
  process.on("message", async(mockApi) => {
    if (!mockApi) {
      await cb(...args);

      process.exit(0);
    }

    const kScorecardAgent = new MockAgent();
    const kScorecardPool = kScorecardAgent.get(mockApi.baseUrl);
    kScorecardAgent.disableNetConnect();

    const request = mockApi.intercept;
    const response = mockApi.response;
    kScorecardPool.intercept(request).reply(response.status, () => response.body);
    setGlobalDispatcher(kScorecardAgent);

    await cb(...args);

    process.exit(0);
  });
}

function buildOptions(pkgName, baseUrl) {
  return {
    baseUrl,
    intercept: {
      path: `/projects/github.com/${pkgName}`,
      method: "GET"
    },
    response: {
      status: 200,
      body: {
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
            score: 10,
            reason: "nananinanana"
          }
        ]
      }
    }
  };
}
