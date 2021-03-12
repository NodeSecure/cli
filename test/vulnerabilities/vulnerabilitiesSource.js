/* eslint-disable max-nested-callbacks */
"use strict";

const { setVulnerabilityStrategy, getVulnerabilityStrategy } = require("../../src/vulnerabilities/vulnerabilitiesSource");

const { VULN_MODE_DB_SECURITY_WG, VULN_MODE_NPM_AUDIT } = require("../../src/vulnerabilities/strategies");
const NPMAuditStrategyModule = require("../../src/vulnerabilities/strategies/npm-audit");
const SecurityWGStrategyModule = require("../../src/vulnerabilities/strategies/security-wg");


describe("Vulnerability source strategies", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Strategies initializations", () => {
        it("should get the default strategy without explicitly setting it", async() => {
            const defaultStrategy = await getVulnerabilityStrategy();
            expect(defaultStrategy.type).toStrictEqual(VULN_MODE_DB_SECURITY_WG);
        });

        it("should get the default strategy by setting and getting it", async() => {
            await setVulnerabilityStrategy(VULN_MODE_NPM_AUDIT);
            const npmStrategy = await getVulnerabilityStrategy();
            expect(npmStrategy.type).toStrictEqual(VULN_MODE_NPM_AUDIT);
        });

        it("should set the default strategy whenever no param or incorrect param is supplied", async() => {
            const UNIMPLEMENTED_VULN_MODE_DB = "db_snyk";
            await setVulnerabilityStrategy(UNIMPLEMENTED_VULN_MODE_DB);
            const defaultStrategy = await getVulnerabilityStrategy();
            expect(defaultStrategy.type).toStrictEqual(VULN_MODE_DB_SECURITY_WG);

            await setVulnerabilityStrategy();
            const alsoDefaultStrategy = await getVulnerabilityStrategy();
            expect(alsoDefaultStrategy.type).toStrictEqual(VULN_MODE_DB_SECURITY_WG);
        });
    });

    describe("Security Working Group Strategy", () => {
        it("should instantiate default Security Working Group Strategy", async() => {
            const vulnSource = await setVulnerabilityStrategy(VULN_MODE_DB_SECURITY_WG);

            expect(vulnSource.type).toStrictEqual(VULN_MODE_DB_SECURITY_WG);
        });

        it("should call one of the SWG's strategy methods", async() => {
            const vulnSource = await setVulnerabilityStrategy(VULN_MODE_DB_SECURITY_WG);

            SecurityWGStrategyModule.SecurityWGStrategy.hydrateNodeSecurePayload = jest.fn().mockResolvedValue();

            const hydrateNodeSecurePayloadSpy = jest
                .spyOn(vulnSource, "hydrateNodeSecurePayload");

            await vulnSource.hydrateNodeSecurePayload({});
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledTimes(1);
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledWith({});
        });
    });
    describe("switch to NPM Audit Strategy", () => {
        it("should instantiate NPM Audit Strategy", async() => {
            const vulnSource = await setVulnerabilityStrategy(VULN_MODE_NPM_AUDIT);
            expect(vulnSource.type).toStrictEqual(VULN_MODE_NPM_AUDIT);
        });

        it("should call one of the NPM Audit's strategy methods", async() => {
            const vulnSource = await setVulnerabilityStrategy(VULN_MODE_NPM_AUDIT);

            NPMAuditStrategyModule.NPMAuditStrategy.hydrateNodeSecurePayload = jest.fn().mockResolvedValue();

            const hydrateNodeSecurePayloadSpy = jest.spyOn(
                vulnSource, "hydrateNodeSecurePayload"
            ).mockResolvedValue();

            await vulnSource.hydrateNodeSecurePayload({});
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledTimes(1);
            expect(hydrateNodeSecurePayloadSpy).toHaveBeenCalledWith({});
        });
    });
});

