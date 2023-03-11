// Import Third-party Dependencies
import { getManifestEmoji } from "@nodesecure/flags/web";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.js";

// CONSTANTS
const kFlagsEmojis = Object.fromEntries(getManifestEmoji());

export async function getJSON(path, customHeaders = Object.create(null)) {
  const headers = {
    Accept: "application/json"
  };

  const raw = await fetch(path, {
    method: "GET",
    headers: Object.assign({}, headers, customHeaders)
  });

  return raw.json();
}

/**
 * @param {!number} id
 * @param {boolean} [hasWarnings=false]
 * @param {string} [theme=LIGHT] theme
 * @returns {{color: string, font: {color: string }}}
 */
export function getNodeColor(id, hasWarnings = false, theme = "LIGHT") {
  // id 0 is the root package (so by default he is highlighted as selected).
  if (id === 0) {
    return CONSTANTS.COLORS[theme].SELECTED;
  }
  else if (hasWarnings) {
    return CONSTANTS.COLORS[theme].WARN;
  }

  return CONSTANTS.COLORS[theme].DEFAULT;
}

export function getFlagsEmojisInlined(flags, flagsToIgnore) {
  return [...flags]
    .filter((title) => !flagsToIgnore.has(title))
    .map((title) => kFlagsEmojis[title] ?? null)
    .filter((value) => value !== null && !flagsToIgnore.has(value))
    .reduce((acc, cur) => `${acc} ${cur}`, "");
}
