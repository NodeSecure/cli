"use strict";

function applyWarnings(dependencies) {
    const warnings = [];

    if (dependencies.has("@scarf/scarf")) {
        warnings.push("The dependency @scarf/scarf has been detected in the dependency Tree.");
    }

    return warnings;
}

module.exports = applyWarnings;
