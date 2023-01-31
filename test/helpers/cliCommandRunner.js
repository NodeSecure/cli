// Import Node.js Dependencies
import { fork } from "node:child_process";
import { createInterface } from "node:readline";

// Import Third-party Dependencies
import { MockAgent, setGlobalDispatcher } from "undici";

// Import Internal Dependencies
import { getCurrentRepository } from "../../src/commands/scorecard.js";

function initMockCli(options) {
  const { path, args, mockApiOptions } = options;

  return async() => {
    const childProcess = fork(path, args, {
      stdio: ["ignore", "pipe", "pipe", "ipc"]
    });
    childProcess.send(mockApiOptions);

    const rStream = createInterface(childProcess.stdout);
    const lines = [];

    for await (const line of rStream) {
      lines.push(line);
    }

    if (!options.keepAlive) {
      childProcess.kill();
    }

    return lines;
  };
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

export function runCliCommand(cb, args = []) {
  process.on("message", async(mockApi) => {
    if (!mockApi) {
      cb(...args).then(() => process.exit(0));
    }

    const kScorecardAgent = new MockAgent();
    const kScorecardPool = kScorecardAgent.get(mockApi.baseUrl);
    kScorecardAgent.disableNetConnect();

    kScorecardPool.intercept(mockApi.intercept).reply(mockApi.response.status, () => mockApi.response.body);
    setGlobalDispatcher(kScorecardAgent);

    cb(...args).then(() => process.exit(0));
  });
}

export function initCliRunner(options) {
  if (typeof options.path !== "string") {
    throw new Error(`CLI_COMMAND_RUNNER_ERROR: Needs 'options.path' value to fork a file (given: ${options.path}).`);
  }

  const packageName = options.packageName ?? getCurrentRepository();
  const args = packageName ? [packageName] : [];
  const apiOptions = options.api;

  let mockApiOptions = null;
  if (apiOptions) {
    const { shouldFail, baseUrl } = apiOptions;
    const mockPkgName = shouldFail ? null : packageName;

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
    mockAndGetLines: initMockCli(forkOptions),
    mockApiOptions
  };

  return result;
}
