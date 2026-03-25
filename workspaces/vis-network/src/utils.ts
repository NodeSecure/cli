// Import Third-party Dependencies
import { getManifestEmoji } from "@nodesecure/flags/web";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.ts";

declare global {
  interface Window {
    i18n: Record<string, unknown>;
  }
}

// CONSTANTS
export const FLAGS_EMOJIS = Object.fromEntries(getManifestEmoji());

export async function getJSON(
  path: string,
  customHeaders: Record<string, string> = Object.create(null)
): Promise<unknown> {
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

export interface NodeColorOptions {
  id: number;
  hasWarnings?: boolean;
  theme?: string;
  isFriendly?: boolean;
}

export function getNodeColor(
  options: NodeColorOptions
) {
  const {
    id,
    hasWarnings = false,
    theme = "LIGHT",
    isFriendly = false
  } = options;

  const palette = CONSTANTS.COLORS[theme as keyof typeof CONSTANTS.COLORS];

  // id 0 is the root package (so by default he is highlighted as selected).
  if (id === 0) {
    return palette.SELECTED;
  }
  else if (hasWarnings) {
    return palette.WARN;
  }
  else if (isFriendly) {
    return palette.FRIENDLY;
  }

  return palette.DEFAULT;
}

export function getFlagsEmojisInlined(
  flags: Iterable<string>,
  flagsToIgnore: Set<string> = new Set()
): string {
  return [...flags]
    .flatMap((title) => {
      if (flagsToIgnore.has(title)) {
        return [];
      }

      const emoji = FLAGS_EMOJIS[title];

      return emoji ? [emoji] : [];
    })
    .filter((emoji) => !flagsToIgnore.has(emoji))
    .reduce((acc, cur) => `${acc} ${cur}`, "");
}

// Note: this works only if vis-network is used within CLI UI, not as a standalone.
export function currentLang(): string {
  const detectedLang = (document.getElementById("lang") as HTMLElement).dataset.lang!;

  return detectedLang in window.i18n ? detectedLang : "english";
}
