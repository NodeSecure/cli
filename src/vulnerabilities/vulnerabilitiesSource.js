"use strict";

const { VULN_MODE_DB_SECURITY_WG, VULN_MODE_NPM_AUDIT } = require("./strategies");
const { NPMAuditStrategy } = require("./strategies/npm-audit");
const { SecurityWGStrategy } = require("./strategies/security-wg");

let strategy;

async function setVulnerabilityStrategy(newStrategy = VULN_MODE_DB_SECURITY_WG, options = {}) {
    strategy = await initVulnerabilityStrategy(newStrategy, options);

    return strategy;
}

async function getVulnerabilityStrategy() {
    if (!strategy) {
        const initializedStrategy = await setVulnerabilityStrategy(VULN_MODE_DB_SECURITY_WG);

        return initializedStrategy;
    }

    return strategy;
}

async function initVulnerabilityStrategy(strategy, options) {
    switch (strategy) {
        case VULN_MODE_DB_SECURITY_WG:
            return Object.seal(await SecurityWGStrategy(options));

        case VULN_MODE_NPM_AUDIT:
            return Object.seal(NPMAuditStrategy());

        default:
            return Object.seal(await SecurityWGStrategy(options));
    }
}


module.exports = { setVulnerabilityStrategy, getVulnerabilityStrategy };
