"use strict";

// Require Internal Dependencies
const SecurityWGStrategyModule = require("../../src/vulnerabilities/strategies/security-wg");


describe("Security Working Group inner methods", () => {
    let spy;

    beforeAll(() => {
        spy = jest.spyOn(SecurityWGStrategyModule, "checkHydrateDB");
    });

    it("should delete and hydrate vulnerabilities DB without side effects", async() => {
        const vulnStrategy = await SecurityWGStrategyModule.SecurityWGStrategy({ sideEffects: false });
        vulnStrategy.deleteDB();
        await vulnStrategy.hydrateDB();
    });
    it("should delete and hydrate vulnerabilities DB with side effects", async() => {
        await SecurityWGStrategyModule.SecurityWGStrategy({ sideEffects: true });
        await (() => expect(spy).toHaveBeenCalledTimes(1));
    });
});


