// Import Node.js Dependencies
import { styleText } from "node:util";

/**
 * @typedef {import("node:util").ForegroundColors} ForegroundColors
 * @typedef {import("node:util").BackgroundColors} BackgroundColors
 * @typedef {import("node:util").Modifiers} Modifiers
 * @typedef {ForegroundColors | BackgroundColors | Modifiers} StyleName
 */

/**
 * @typedef {((text: string) => string) & Record<StyleName, Formatter>} Formatter
 */

/**
 * Creates a chainable formatter for terminal styling using Node.js styleText
 * @param {StyleName[]} styles - Array of styles to apply
 * @returns {Formatter}
 */
function createFormatter(styles = []) {
  function fn(text) {
    // When called without arguments, return the formatter for chaining
    if (text === undefined) {
      return formatter;
    }

    // Convert to string since styleText only accepts strings
    return styleText(styles, String(text));
  }

  const formatter = new Proxy(fn, {
    get: (_, prop) => createFormatter([...styles, prop])
  });

  return formatter;
}

const formatter = createFormatter();

export default formatter;
