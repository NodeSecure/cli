"use strict";

// Require Internal Dependencies
const NPMAuditStrategy = require("../../src/vulnerabilities/strategies/npm-audit");

test("Run NPM Audit and get vulnerabilities", async() => {
    const vulnStrategy = NPMAuditStrategy();
    await vulnStrategy.hydrateNodeSecurePayload({});
});
