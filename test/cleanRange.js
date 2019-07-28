"use strict";

// Require Internal Dependencies
const { cleanRange } = require("../src/utils");

test("should return cleaned SemVer range", () => {
    const r1 = cleanRange("0.1.0");
    const r2 = cleanRange("^1.0.0");
    const r3 = cleanRange(">=2.0.0");

    expect(r1).toStrictEqual("0.1.0");
    expect(r2).toStrictEqual("1.0.0");
    expect(r3).toStrictEqual("2.0.0");
});
