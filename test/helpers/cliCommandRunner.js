// Import Node.js Dependencies
import { fork } from "node:child_process";
import { createInterface } from "node:readline";

// Import Third-party Dependencies
import { MockAgent, setGlobalDispatcher } from "undici";
import stripAnsi from "strip-ansi";

export async function runProcess(options) {
  const { path, args = [], cwd = process.cwd(), undiciMockAgentOptions = null } = options;

  const childProcess = fork(path, args, {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    cwd
  });
  // send needed options to trigger the `prepareProcess()` command.
  childProcess.send(undiciMockAgentOptions);

  const rStream = createInterface(childProcess.stdout);
  const lines = [];

  for await (const line of rStream) {
    lines.push(stripAnsi(line));
  }

  childProcess.kill();

  return lines;
}

export function prepareProcess(command, args = []) {
  process.on("message", (undiciMockAgentOptions) => {
    if (undiciMockAgentOptions) {
      const { baseUrl, intercept, response } = undiciMockAgentOptions;
      const mockAgent = new MockAgent();
      const pool = mockAgent.get(baseUrl);

      mockAgent.disableNetConnect();
      pool.intercept(intercept).reply(response.status, () => undiciMockAgentOptions.response.body);
      setGlobalDispatcher(mockAgent);
    }

    command(...args).then(() => process.exit(0));
  });
}
