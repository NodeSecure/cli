/* eslint-disable max-len */
"use strict";

// Require Third-party Dependencies
const { taggedString } = require("./utils");

// CONSTANTS
const kDetectedDep = taggedString`The dependency '${0}' has been detected in the dependency Tree.`;
const kWarningsMessages = Object.freeze({
    "@scarf/scarf": "This dependency could collect data against your will so think to disable it with the env var: SCARF_ANALYTICS",
    iohook: "This dependency can retrieve your keyboard and mouse inputs. It can be used for 'keylogging' attacks/malwares."
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
