"use strict";

const { VULN_MODE_DB_SECURITY_WG, VULN_MODE_NPM_AUDIT } = require("./strategies");
const { NPMAuditStrategy } = require("./strategies/npm-audit");
const { SecurityWGStrategy } = require("./strategies/security-wg");

let strategy;

async function setVulnerabilityStrategy(newStrategy) {
    strategy = await initVulnerabilityStrategy(newStrategy);

    return strategy;
}

async function getVulnerabilityStrategy() {
    const initializedStrategy = await setVulnerabilityStrategy(VULN_MODE_DB_SECURITY_WG);

    return strategy || initializedStrategy;
}

async function initVulnerabilityStrategy(strategy) {
    switch (strategy) {
        case VULN_MODE_DB_SECURITY_WG:
            return Object.seal(await SecurityWGStrategy());

        case VULN_MODE_NPM_AUDIT:
            return Object.seal(NPMAuditStrategy());

        default:
            return Object.seal(await SecurityWGStrategy());
    }
}


module.exports = { setVulnerabilityStrategy, getVulnerabilityStrategy };
