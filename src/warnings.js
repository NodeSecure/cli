"use strict";

function applyWarnings(dependencies) {
    const warnings = [];

    if (dependencies.has("@scarf/scarf")) {
        // eslint-disable-next-line
        warnings.push("The dependency '@scarf/scarf' has been detected in the dependency Tree. This dependency could collect data against your will so think to disable it with the env var: SCARF_ANALYTICS");
    }

    return warnings;
}

module.exports = applyWarnings;
