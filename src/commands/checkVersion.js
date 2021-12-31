import semver from "semver";

export const kVersionRange = ">=3.0.0";

/**
 * @description will return a validator
 * which should satisfies the VERSION_RANGE
 *
 * => Exported for test purpose
 *
 * @param {string} acceptedVersionRange
 * @returns {Function} (scannerVersion: string) => boolean
 *
 */
export function buildVersionChecker(acceptedVersionRange) {
  return function isAnalysisVersionValid(scannerVersion) {
    const cleanedScannerVersion = semver.coerce(scannerVersion);

    return semver.satisfies(cleanedScannerVersion, acceptedVersionRange);
  };
}

export const isAnalysisVersionValid = buildVersionChecker(kVersionRange);
