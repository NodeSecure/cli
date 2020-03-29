/* eslint-disable global-require */
"use strict";

// Require Node.js Dependencies
const os = require("os");
const { join } = require("path");

// Require Third-party Depedencies
const cacache = require("cacache");
const get = require("lodash.get");

// CONSTANTS
const kCachePath = join(os.tmpdir(), "nsecure-cli");
const kDefaultLanguage = "english";

// VARS
const TOKENS = {
    english: require("../i18n/english.js")
};
const CONSTANTS = Object.seal({
    CACHE_PATH: kCachePath,
    LANG_UPDATED: true,
    CURRENT_LANG: kDefaultLanguage
});

function getLocalLang() {
    if (CONSTANTS.LANG_UPDATED) {
        try {
            const { data } = cacache.get.sync(kCachePath, "cli-lang");
            CONSTANTS.CURRENT_LANG = data.toString();
        }
        catch (error) {
            cacache.put(kCachePath, "cli-lang", kDefaultLanguage);
            CONSTANTS.CURRENT_LANG = kDefaultLanguage;
        }
        CONSTANTS.LANG_UPDATED = false;
    }

    return CONSTANTS.CURRENT_LANG;
}

async function setLocalLang(selectedLang) {
    await cacache.put(kCachePath, "cli-lang", selectedLang);
}

function getToken(token, ...params) {
    if (typeof token !== "string") {
        throw new TypeError("token must be a string");
    }

    const lang = getLocalLang();
    if (!Reflect.has(TOKENS, lang)) {
        throw new Error(`Invalid i18n lang -> ${lang}`);
    }

    const langToken = get(TOKENS[lang], token);
    if (typeof langToken === "undefined" || langToken === null) {
        throw new Error(`Invalid i18n token -> ${token} for lang -> ${lang}`);
    }

    return params.length === 0 ? langToken : langToken(...params);
}

module.exports = {
    getToken,
    getLocalLang,
    setLocalLang,
    CONSTANTS
};
