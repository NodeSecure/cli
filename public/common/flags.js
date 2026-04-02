// Import Third-party Dependencies
import { getManifest } from "@nodesecure/flags/web";

// CONSTANTS
export const IGNORABLE_FLAGS = new Set([
  "hasManyPublishers",
  "hasIndirectDependencies",
  "hasMissingOrUnusedDependency",
  "isDead",
  "isOutdated",
  "hasDuplicate"
]);
export const FLAG_IGNORE_ITEMS = Object.values(getManifest())
  .filter(({ title }) => IGNORABLE_FLAGS.has(title))
  .map(({ title, emoji }) => {
    return { value: title, label: title, emoji };
  });
