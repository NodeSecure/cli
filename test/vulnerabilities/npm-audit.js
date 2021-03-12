"use strict";

const { VULN_MODE_NPM_AUDIT } = require("../../src/vulnerabilities/strategies");
// Require Internal Dependencies
const { NPMAuditStrategy } = require("../../src/vulnerabilities/strategies/npm-audit");

test("Run NPM Audit and get vulnerabilities", async() => {
    const vulnStrategy = await NPMAuditStrategy();
    expect(vulnStrategy.type).toStrictEqual(VULN_MODE_NPM_AUDIT);
    await vulnStrategy.hydrateNodeSecurePayload({});
});
