/* eslint-disable max-len */
"use strict";

// Require Third-party Dependencies
const { taggedString } = require("./utils");
const i18n = require('./i18n');

// CONSTANTS
const kDetectedDep = taggedString`The dependency '${0}' has been detected in the dependency Tree.`;
const kWarningsMessages = Object.freeze({
    "@scarf/scarf": i18n.getToken("ui.popups.warnings.disable_scarf"),
    iohook: i18n.getToken("ui.popups.warnings.keylogging")
});
const kPackages = new Set(Object.keys(kWarningsMessages));

function getWarning(depName) {
    return `${kDetectedDep(depName)} ${kWarningsMessages[depName]}`;
}

function applyWarnings(dependencies) {
    const warnings = [];
    for (const depName of kPackages) {
        if (dependencies.has(depName)) {
            warnings.push(getWarning(depName));
        }
    }

    return warnings;
}

module.exports = applyWarnings;
