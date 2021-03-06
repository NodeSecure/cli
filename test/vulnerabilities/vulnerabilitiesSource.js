"use strict";

const { VulnerabilityStrategy, getVulnerabilityStrategy } = require("../../src/vulnerabilities/vulnerabilitiesSource");

const { VULN_MODE_DB_SECURITY_WG, VULN_MODE_NPM_AUDIT } = require("../../src/vulnerabilities/strategies");
const SecurityWGStrategy = require("../../src/vulnerabilities/strategies/security-wg");
const NPMAuditStrategy = require("../../src/vulnerabilities/strategies/npm-audit");


describe("Vulnerability source strategies", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Security Working Group Strategy", () => {
        const securityWGStrategy = SecurityWGStrategy();
        const vulnSource = VulnerabilityStrategy(securityWGStrategy);

        it("should instantiate default Security Working Group Strategy", () => {
            expect(vulnSource.type).toStrictEqual(VULN_MODE_DB_SECURITY_WG);
        });

        it("should call one of the SWG's strategy methods", async() => {
            securityWGStrategy.hydrateNodeSecurePayload = jest.fn().mockResolvedValue();
            const hydrateNodeSecurePayloadSpy = jest
                .spyOn(securityWGStrategy, "hydrateNodeSecurePayload");

            await vulnSource.hydrateNodeSecurePayload({});
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledTimes(1);
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledWith({});
        });
    });
    describe("switch to NPM Audit Strategy", () => {
        const auditStrategy = NPMAuditStrategy();
        const vulnSource = VulnerabilityStrategy(auditStrategy);

        it("should instantiate NPM Audit Strategy", () => {
            expect(vulnSource.type).toStrictEqual(VULN_MODE_NPM_AUDIT);
        });

        it("should call one of the NPM Audit's strategy methods", async() => {
            const hydrateNodeSecurePayloadSpy = jest.spyOn(
                auditStrategy, "hydrateNodeSecurePayload"
            ).mockResolvedValue();

            await vulnSource.hydrateNodeSecurePayload({});
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledTimes(1);
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledWith({});
        });
    });
});

