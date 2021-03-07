"use strict";

const SecurityWGStrategy = require("./strategies/security-wg");

let strategy;

function VulnerabilityStrategy(newStrategy = SecurityWGStrategy()) {
    strategy = Object.seal(newStrategy);

    return strategy;
}

function getVulnerabilityStrategy() {
    return strategy || VulnerabilityStrategy();
}

module.exports = { VulnerabilityStrategy, getVulnerabilityStrategy };
