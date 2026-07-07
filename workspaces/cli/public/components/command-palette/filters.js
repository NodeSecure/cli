// Import Third-party Dependencies
import semver from "semver";
import sizeSatisfies from "@nodesecure/size-satisfies";
import { getManifestEmoji } from "@nodesecure/flags/web";

// CONSTANTS
export const FLAG_LIST = [...getManifestEmoji()].map(([name, emoji]) => {
  return {
    emoji,
    name
  };
});
export const SIZE_PRESETS = [
  { label: "< 10 kb", value: "<10kb" },
  { label: "10 – 100 kb", value: "10kb..100kb" },
  { label: "> 100 kb", value: ">100kb" }
];
export const VERSION_PRESETS = [
  { label: "0.x", value: "0.x" },
  { label: "≥ 1.0", value: ">=1.0.0" },
  { label: "< 1.0", value: "<1.0.0" }
];
export const FILTERS_NAME = new Set([
  "package",
  "version",
  "flag",
  "license",
  "author",
  "ext",
  "builtin",
  "size",
  "highlighted",
  "dep"
]);
export const PRESETS = [
  { id: "has_vulnerabilities", filter: "flag", value: "hasVulnerabilities" },
  { id: "has_scripts", filter: "flag", value: "hasScript" },
  { id: "no_license", filter: "flag", value: "hasNoLicense" },
  { id: "deprecated", filter: "flag", value: "isDeprecated" },
  { id: "large", filter: "size", value: ">100kb" }
];
// Filters that use a searchable text-based list (not a rich visual panel)
export const FILTER_HAS_HELPERS = new Set(["license", "ext", "builtin", "author", "dep"]);
// Filters where the mode persists after selection (multi-select)
export const FILTER_MULTI_SELECT = new Set(["flag"]);
// Filters that auto-confirm immediately on selection (no text input needed)
export const FILTER_INSTANT_CONFIRM = new Set(["highlighted"]);

/**
 * Returns per-flag package counts across the full linker.
 *
 * @param {Map<number, object>} linker
 * @returns {Map<string, number>}
 */
export function getFlagCounts(linker) {
  const counts = new Map();
  for (const { flags } of linker.values()) {
    for (const flag of flags) {
      counts.set(flag, (counts.get(flag) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Returns per-value package counts for list-type filters.
 *
 * @param {Map<number, object>} linker
 * @param {string} filterName
 * @returns {Map<string, number>}
 */
export function getFilterValueCounts(linker, filterName) {
  if (filterName === "dep") {
    const counts = new Map();
    for (const opt of linker.values()) {
      const dependentCount = Object.keys(opt.usedBy).length;
      if (dependentCount > 0) {
        counts.set(opt.name, (counts.get(opt.name) ?? 0) + dependentCount);
      }
    }

    return counts;
  }

  const counts = new Map();
  for (const opt of linker.values()) {
    for (const value of getValuesForCount(opt, filterName)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return counts;
}

function getValuesForCount(opt, filterName) {
  switch (filterName) {
    case "license":
      return opt.uniqueLicenseIds ?? [];
    case "ext":
      return opt.composition.extensions.filter((ext) => ext !== "");
    case "builtin":
      return opt.composition.required_nodejs;
    case "author": {
      if (opt.author === null) {
        return [];
      }
      const name = typeof opt.author === "string" ? opt.author : opt.author?.name;

      return name ? [name] : [];
    }
    default:
      return [];
  }
}

/**
 * @param {Map<number, object>} linker
 * @param {string} filterName
 * @returns {{ display: string, value: string }[]}
 */
export function getHelperValues(linker, filterName) {
  switch (filterName) {
    case "license": {
      const items = new Set();
      for (const { uniqueLicenseIds = [] } of linker.values()) {
        for (const id of uniqueLicenseIds) {
          items.add(id);
        }
      }

      return [...items].map((licenseId) => {
        return { display: licenseId, value: licenseId };
      });
    }
    case "ext": {
      const items = new Set();
      for (const { composition } of linker.values()) {
        for (const ext of composition.extensions) {
          items.add(ext);
        }
      }

      items.delete("");

      return [...items].map((ext) => {
        return { display: ext, value: ext };
      });
    }
    case "builtin": {
      const items = new Set();
      for (const { composition } of linker.values()) {
        for (const module of composition.required_nodejs) {
          items.add(module);
        }
      }

      return [...items].map((module) => {
        return { display: module, value: module };
      });
    }
    case "author": {
      const items = new Set();
      for (const { author } of linker.values()) {
        if (author === null) {
          continue;
        }

        if (typeof author === "string") {
          items.add(author);
        }
        else if (Object.hasOwn(author, "name")) {
          items.add(author.name);
        }
      }

      return [...items].map((name) => {
        return { display: name, value: name };
      });
    }
    case "dep": {
      const items = new Set();
      for (const { name } of linker.values()) {
        items.add(name);
      }

      return [...items].sort().map((name) => {
        return { display: name, value: name };
      });
    }
    default:
      return [];
  }
}

/**
 * Returns the Set of package IDs (as strings) matching the given filter+value.
 *
 * @param {Map<number, object>} linker
 * @param {string} filterName
 * @param {string} inputValue
 * @returns {Set<string>}
 */
export function computeMatches(linker, filterName, inputValue) {
  if (filterName === "dep") {
    return computeDepMatches(linker, inputValue);
  }

  const matchingIds = new Set();

  for (const [id, opt] of linker) {
    if (matchesFilter(opt, filterName, inputValue)) {
      matchingIds.add(String(id));
    }
  }

  return matchingIds;
}

/**
 * Collect packages that depend on package matching inputValue
 *
 * @param {Map<number, object>} linker
 * @param {string} inputValue
 * @returns {Set<string>}
 */
function computeDepMatches(linker, inputValue) {
  const matchingIds = new Set();

  try {
    const regex = new RegExp(inputValue, "i");

    const dependentNames = new Set();
    for (const opt of linker.values()) {
      if (regex.test(opt.name)) {
        for (const dependency of Object.keys(opt.usedBy)) {
          dependentNames.add(dependency);
        }
      }
    }

    for (const [id, opt] of linker) {
      if (dependentNames.has(opt.name)) {
        matchingIds.add(String(id));
      }
    }
  }
  catch {
    // invalid regex
  }

  return matchingIds;
}

function matchesFilter(opt, filterName, inputValue) {
  switch (filterName) {
    case "package": {
      try {
        return new RegExp(inputValue, "gi").test(opt.name);
      }
      catch {
        return false;
      }
    }
    case "version": {
      try {
        return semver.satisfies(opt.version, inputValue);
      }
      catch {
        return false;
      }
    }
    case "license": {
      try {
        const regex = new RegExp(inputValue, "gi");

        return opt.uniqueLicenseIds.some((licenseId) => regex.test(licenseId));
      }
      catch {
        return false;
      }
    }
    case "ext": {
      const extensions = new Set(opt.composition.extensions);
      const wanted = inputValue.startsWith(".") ? inputValue : `.${inputValue}`;

      return extensions.has(wanted.toLowerCase());
    }
    case "size": {
      try {
        return sizeSatisfies(inputValue, opt.size);
      }
      catch {
        return false;
      }
    }
    case "builtin": {
      try {
        const regex = new RegExp(inputValue, "gi");

        return opt.composition.required_nodejs.some((mod) => regex.test(mod));
      }
      catch {
        return false;
      }
    }
    case "author": {
      try {
        const regex = new RegExp(inputValue, "gi");

        return (typeof opt.author === "string" && regex.test(opt.author)) ||
          (opt.author !== null && Object.hasOwn(opt.author, "name") && regex.test(opt.author.name));
      }
      catch {
        return false;
      }
    }
    case "flag":
      return opt.flags.includes(inputValue);
    case "highlighted":
      return inputValue === "all" ? opt.isHighlighted === true : opt.isHighlighted !== true;
    default:
      return false;
  }
}
