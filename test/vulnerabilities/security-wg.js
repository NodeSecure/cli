"use strict";

// Require Internal Dependencies
const { SecurityWGStrategy } = require("../../src/vulnerabilities/strategies/security-wg");

test("Delete and hydrate vulnerabilities DB", async() => {
    const vulnStrategy = await SecurityWGStrategy();
    vulnStrategy.deleteDB();
    await vulnStrategy.hydrateDB();
});
