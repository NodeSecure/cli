// Import Node.js Dependencies
import { fork } from "node:child_process";
import { createInterface } from "node:readline";

// Import Third-party Dependencies
import { MockAgent, setGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { getCurrentRepository } from "../../src/commands/scorecard.js";

function initChildProcess({ path, args, mockApiOptions }) {
  const childProcess = fork(path, args, {
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });
  childProcess.send(mockApiOptions);

  return childProcess;
}

async function forkAndGetLines(options) {
  const childProcess = initChildProcess(options);
  const rStream = createInterface(childProcess.stdout);
  const lines = [];

  for await (const line of rStream) {
    lines.push(line);
  }

  if (!options.keepAlive) {
    childProcess.kill();
  }

  return lines;
}

function getMockApiOptions(pkgName, options) {
  // use faker.js
  const defaultIntercept = {
    path: `/projects/github.com/${pkgName}`,
    method: "GET"
  };

  const defaultBody = {
    date: "2222-12-31",
    repo: {
      name: `github.com/${pkgName}`
    },
    score: 5.2,
    checks: [
      {
        name: "Maintained",
        score: 10,
        reason: "Package is maintained"
      }
    ]
  };

  const { response, intercept: customIntercept, baseUrl } = options;
  const intercept = customIntercept || defaultIntercept;
  const body = response?.body ?? defaultBody;
  const status = response?.status ?? 200;

  return {
    baseUrl,
    intercept,
    response: {
      status,
      body
    }
  };
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

export function initCliRunner(options) {
  if (typeof options.path !== "string") {
    throw new Error(`CLI_COMMAND_RUNNER_ERROR: Needs 'options.path' value to fork a file (given: ${options.path}).`);
  }

  const packageName = options.packageName || getCurrentRepository();
  const args = packageName ? [packageName] : [];
  const apiOptions = options.api;

  let mockApiOptions = null;
  if (apiOptions) {
    const { mustReturn404, baseUrl } = apiOptions;
    const mockPkgName = mustReturn404 ? null : packageName;

    if (!baseUrl) {
      throw new Error("CLI_COMMAND_RUNNER_ERROR: A dummy response API requires value 'options.api.baseUrl'.");
    }

    mockApiOptions = getMockApiOptions(mockPkgName, apiOptions);
  }

  const forkOptions = {
    path: options.path,
    args,
    mockApiOptions
  };
  const result = {
    forkAndGetLines: forkAndGetLines.bind(null, forkOptions),
    mockApiOptions
  };

  return result;
}
