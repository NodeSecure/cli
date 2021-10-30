// Import Node.js Dependencies
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

// Import Third-party Dependencies
import split from "split2";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProcessDir = path.join(__dirname, "..", "process");

describe("summary", () => {
  it("should execute summary command on fixtures 'result-test1.json'", async() => {
    const lines = [
      /Global Stats: express.*$/,
      /.*/,
      /Total of packages:.*60.*$/,
      /Total size:.*1.59 MB.*$/,
      /Packages with indirect dependencies:.*6.*$/,
      /.*/,
      /Extensions:.*$/,
      /\(52\) \.md - \(52\) \.js - \(50\) {2}- \(52\) \.json - \(5\) \.ts - \(1\) \.yml.*$/,
      /.*/,
      /Licenses:.*$/,
      /\(48\) MIT - \(1\) BSD-3-Clause - \(3\) ISC.*$/,
      /.*/
    ];

    const child = spawn(process.execPath, [path.join(kProcessDir, "summary.js")], {
      cwd: path.join(__dirname, "..", "fixtures"),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false
    });

    try {
      const rStream = child.stdout.pipe(split());
      for await (const line of rStream) {
        const regexp = lines.shift();

        expect(regexp).toBeDefined();
        expect(regexp.test(line)).toStrictEqual(true);
      }
    }
    finally {
      child.kill();
    }
  });
});
