import semver from "semver";

export const kVersionRange = ">=0.7.0";

/**
 * @description will return a validator
 * which should satisfies the VERSION_RANGE
 *
 * => Exported for test purpose
 *
 * @param {string} acceptedVersionRange
 * @returns {Function} (packageVersion: string) => boolean
 *
 */
export function buildVersionChecker(acceptedVersionRange) {
  return function isAnalysisVersionValid(packageVersion) {
    const cleanedPackageVersion = semver.coerce(packageVersion);

    return semver.satisfies(cleanedPackageVersion, acceptedVersionRange);
  };
}

export const isAnalysisVersionValid = buildVersionChecker(kVersionRange);
