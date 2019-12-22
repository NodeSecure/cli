"use strict";

// Require Internal Dependencies
const { getRegistryURL } = require("../src/utils");

test("getRegistryURL should return the npm registry URL", async() => {
    const result = getRegistryURL();
    expect(result).toStrictEqual("https://registry.npmjs.org/");
});
