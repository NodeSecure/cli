/**
 * Parse a list of CLI package strings into the expected HighlightPackages format expected
 * by @nodesecure/scanner: `string[] | Record<string, string[] | SemverRange>`.
 *
 * Each input string can be:
 *  - "lodash"                 → plain name, no version constraint
 *  - "lodash@^4.0.0"          → name with a semver range
 *  - "lodash@1.0.0,2.0.0"    → name with a list of specific versions
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
  const parsed = items.map(parsePackage);

  const hasVersionConstraints = parsed.some(({ version }) => version !== null);

  if (!hasVersionConstraints) {
    return parsed.map(({ name }) => name);
  }

  return Object.fromEntries(
    parsed.map(({ name, version }) => [name, version ?? "*"])
  );
}

/**
 * @param {string} str
 * @returns {{ name: string, version: string | string[] | null }}
 */
function parsePackage(str) {
  // Scoped packages start with "@", so search for a second "@" after index 1.
  const versionSeparator = str.startsWith("@") ? str.indexOf("@", 1) : str.indexOf("@");

  if (versionSeparator === -1) {
    return { name: str.trim(), version: null };
  }

  const name = str.slice(0, versionSeparator).trim();
  const versionStr = str.slice(versionSeparator + 1).trim();

  if (versionStr === "") {
    return { name, version: null };
  }

  if (versionStr.includes(",")) {
    const versions = versionStr.split(",").map((v) => v.trim()).filter(Boolean);
    let version;
    if (versions.length === 0) {
      version = null;
    }
    else if (versions.length === 1) {
      version = versions[0];
    }
    else {
      version = versions;
    }

    return { name, version };
  }

  return { name, version: versionStr };
}
