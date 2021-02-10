"use strict";
const semver = require("semver");

const VERSION_RANGE = ">=0.7.0";

/**
 * @description will return a validator
 * which should satisfies the VERSION_RANGE
 *
 * @param {string} acceptedVersionRange
 * @returns {Function} (packageVersion: string) => boolean
 *
 */
function buildVersionChecker(acceptedVersionRange) {
    return function isAnalysisVersionValid(packageVersion) {
        const cleanedPackageVersion = semver.coerce(packageVersion);

        return semver.satisfies(cleanedPackageVersion, acceptedVersionRange);
    };
}

module.exports = {
    VERSION_RANGE,
    isAnalysisVersionValid: buildVersionChecker(VERSION_RANGE),
    // exported for tests
    buildVersionChecker
};
