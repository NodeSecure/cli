// Import Third-party Dependencies
import { getManifestEmoji } from "@nodesecure/flags/web";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.js";

// CONSTANTS
export const FLAGS_EMOJIS = Object.fromEntries(getManifestEmoji());

export async function getJSON(path, customHeaders = Object.create(null)) {
  const headers = {
    Accept: "application/json"
  };

  const raw = await fetch(path, {
    method: "GET",
    headers: Object.assign({}, headers, customHeaders)
  });

  if (raw.ok === false) {
    const { status, statusText } = raw;

    return {
      status,
      statusText
    };
  }

  if (raw.status === 204) {
    return null;
  }

  return raw.json();
}

/**
 * @params {object} options
 * @param {string} options.id
 * @param {string} options.hasWarnings
 * @param {string} options.theme
 * @param {string} options.isFriendly
 */
export function getNodeColor(options) {
  const {
    id,
    hasWarnings = false,
    theme = "LIGHT",
    isFriendly = false
  } = options;

  // id 0 is the root package (so by default he is highlighted as selected).
  if (id === 0) {
    return CONSTANTS.COLORS[theme].SELECTED;
  }
  else if (hasWarnings) {
    return CONSTANTS.COLORS[theme].WARN;
  }
  else if (isFriendly) {
    return CONSTANTS.COLORS[theme].FRIENDLY;
  }

  return CONSTANTS.COLORS[theme].DEFAULT;
}

export function getFlagsEmojisInlined(
  flags,
  flagsToIgnore = new Set()
) {
  return [...flags]
    .flatMap((title) => {
      if (flagsToIgnore.has(title)) {
        return [];
      }

      // FIX: when scanner resolve to flags ^3.x
      const emoji = FLAGS_EMOJIS[title === "hasDuplicate" ? "isDuplicated" : title];

      return emoji ? [emoji] : [];
    })
    .filter((emoji) => !flagsToIgnore.has(emoji))
    .reduce((acc, cur) => `${acc} ${cur}`, "");
}

// Note: this works only if vis-network is used within CLI UI, not as a standalone.
export function currentLang() {
  const detectedLang = document.getElementById("lang").dataset.lang;

  return detectedLang in window.i18n ? detectedLang : "english";
}
