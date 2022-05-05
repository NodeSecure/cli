import test from "tape";
import { getI18nKindWarning } from "../../src/commands/utils.js";

const warnings = Object.freeze({
  parsingError: {
    code: "ast-error",
    i18n: "sast_warnings.ast_error"
  },
  unsafeImport: {
    code: "unsafe-import",
    i18n: "sast_warnings.unsafe_import"
  },
  unsafeRegex: {
    code: "unsafe-regex",
    i18n: "sast_warnings.unsafe_regex"
  },
  unsafeStmt: {
    code: "unsafe-stmt",
    i18n: "sast_warnings.unsafe_stmt"
  },
  unsafeAssign: {
    code: "unsafe-assign",
    i18n: "sast_warnings.unsafe_assign"
  },
  encodedLiteral: {
    code: "encoded-literal",
    i18n: "sast_warnings.encoded_literal"
  },
  shortIdentifiers: {
    code: "short-identifiers",
    i18n: "sast_warnings.short_identifiers"
  },
  suspiciousLiteral: {
    code: "suspicious-literal",
    i18n: "sast_warnings.suspicious_literal"
  },
  obfuscatedCode: {
    code: "obfuscated-code",
    i18n: "sast_warnings.obfuscated_code"
  }
});

const astWarnings = [
  {
    kind: "encoded-literal",
    value: "ADDED",
    location: [],
    file: "lib/commands/client/push.js"
  },
  {
    kind: "suspicious-literal",
    value: "ADDED",
    location: [],
    file: "lib/commands/client/push.js"
  }
];

const result = [
  {
    kind: "sast_warnings.encoded_literal",
    value: "ADDED",
    location: [],
    file: "lib/commands/client/push.js"
  },
  {
    kind: "sast_warnings.suspicious_literal",
    value: "ADDED",
    location: [],
    file: "lib/commands/client/push.js"
  }
];

test("Get the value of `kind` property through `i18n` property from CONSTANTS", async(tape) => {
  tape.deepEqual(getI18nKindWarning(astWarnings, warnings), result);
});
