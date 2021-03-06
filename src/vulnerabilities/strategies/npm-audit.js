/* eslint-disable class-methods-use-this */
"use strict";

// Require Third-party Dependencies
const Arborist = require("@npmcli/arborist");

// CONSTANTS
const { constants } = require("../../utils");
const { VULN_MODE_NPM_AUDIT } = require("../strategies");


function NPMAuditStrategy() {
    return {
        type: VULN_MODE_NPM_AUDIT,
        hydrateNodeSecurePayload
    };
}

async function hydrateNodeSecurePayload(dependencies) {
    const arborist = new Arborist({ ...constants.NPM_TOKEN, registry: constants.DEFAULT_REGISTRY_ADDR });

    try {
        const { vulnerabilities } = (await arborist.audit()).toJSON();

        Object.keys(vulnerabilities).forEach((packageName) => {
            const dependenciesVulnerabilities = dependencies.get(packageName).vulnerabilities;
            const packageVulnerabilities = [];

            const { via: vulnSources } = vulnerabilities[packageName];

            for (const vulnSource of vulnSources) {
                const {
                    title, range, id,
                    module_name: name,
                    severity, version,
                    vulnerableVersions
                } = vulnSource;

                const vulnerability = {
                    title,
                    module_name: name,
                    severity, version,
                    vulnerableVersions,
                    range,
                    id
                };
                packageVulnerabilities.push(vulnerability);
            }

            dependenciesVulnerabilities.push(packageVulnerabilities);
        });
    }
    // eslint-disable-next-line no-empty
    catch {}
}


module.exports = NPMAuditStrategy;
