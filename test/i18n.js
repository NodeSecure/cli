"use strict";

// Require Node.js Dependencies
const os = require("os");
const { join } = require("path");

// Require Third-party Depedencies
const cacache = require("cacache");

// Require Internal Dependencies
const i18n = require("../src/i18n");

// CONSTANTS
const kCachePath = join(os.tmpdir(), "nsecure-cli");

test("getToken: token must be a string", () => {
    expect.assertions(2);
    try {
        i18n.getToken(10);
    }
    catch (error) {
        expect(error.name).toStrictEqual("TypeError");
        expect(error.message).toStrictEqual("token must be a string");
    }
});

test("getToken: invalid token", () => {
    expect.assertions(1);
    try {
        i18n.getToken("boo.foo");
    }
    catch (error) {
        expect(error.name).toStrictEqual("Error");
    }
});

test("getLocalLang: force update on the local lang!", async() => {
    await cacache.rm.entry(kCachePath, "cli-lang");

    i18n.CONSTANTS.LANG_UPDATED = true;
    i18n.getLocalLang();

    expect(i18n.CONSTANTS.LANG_UPDATED).toStrictEqual(false);
});


test("setLocalLang to english", async() => {
    await i18n.setLocalLang("english");
});
