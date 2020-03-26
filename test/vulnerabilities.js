"use strict";

// Require Internal Dependencies
const vulnerabilities = require("../src/vulnerabilities");

test("Delete and hydrate vulnerabilities DB", async() => {
    vulnerabilities.deleteDB();

    await vulnerabilities.hydrateDB();
});
