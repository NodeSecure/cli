const fakeVersion = process.argv[2];

if (fakeVersion) {
  Object.defineProperty(process, "versions", {
    value: { ...process.versions, node: fakeVersion }
  });
}

await import("../../bin/check-and-run.js");
