"use strict";

// Require Internal Dependencies
const NPMAuditStrategy = require("../../src/vulnerabilities/strategies/npm-audit");

test("Run NPM Audit and get vulnerabilities", async(done) => {
    const vulnStrategy = NPMAuditStrategy();
    await vulnStrategy.hydrateNodeSecurePayload({});
});
