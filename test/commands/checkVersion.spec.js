// Import Third-party dependencies
import test from "tape";

// Import Internal dependencies
import { buildVersionChecker } from "../../src/commands/checkVersion.js";

test("isAnalysisVersionValid should return true when the version satisfies the range", (tape) => {
  const isPackageValid = buildVersionChecker(">=1.0.0");

  tape.true(isPackageValid("1.0.1"));
  tape.true(isPackageValid("2.0.1-0"));
  tape.true(isPackageValid("3.6.7.9.3-alpha"));

  tape.end();
});

test("isAnalysisVersionValid should return false when the version doesn't satisfies the range", (tape) => {
  const isPackageValid = buildVersionChecker("<=1.0.0");

  tape.false(isPackageValid("1.0.1"));
  tape.false(isPackageValid("2.0.1"));
  tape.false(isPackageValid("3.0.1-0"));
  tape.false(isPackageValid("3.6.7.9.3-alpha"));

  tape.end();
});
