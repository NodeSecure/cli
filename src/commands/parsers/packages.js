// Import Third-party Dependencies
import { parseNpmSpec } from "@nodesecure/mama";

/**
 * Parse a list of CLI package strings into the expected HighlightPackages format expected
 * by @nodesecure/scanner: `string[] | Record<string, string[] | SemverRange>`.
 *
 * Each input string can be:
 *  - "lodash"                 → plain name, no version constraint
 *  - "lodash@^4.0.0"          → name with a semver range
 *  - "@scope/pkg"             → scoped package, no version constraint
 *  - "@scope/pkg@^1.0.0"      → scoped package with a semver range
 *
 * When none of the entries carry a version constraint the function returns a plain `string[]`.
 * If at least one entry has a version constraint the function returns a `Record`;
 * Entries without a constraint are mapped to '*'
 *
 * @param {string | string[]} input
 * @returns {string[] | Record<string, string[] | string>}
 */
export function parsePackages(input) {
  const items = Array.isArray(input) ? input : [input];
  const parsed = items.map(parseNpmSpec);

  const hasVersionConstraints = parsed.some(({ semver }) => semver !== null);

  if (hasVersionConstraints) {
    return Object.fromEntries(
      parsed.map(({ name, semver }) => [name, semver ?? "*"])
    );
  }

  return parsed.map(({ name }) => name);
}
