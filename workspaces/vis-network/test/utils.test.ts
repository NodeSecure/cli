// Import Node.js Dependencies
import assert from "node:assert";

// Import Internal Dependencies
import {
  getFlagsEmojisInlined,
  getJSON,
  getNodeColor
} from "../src/utils.ts";
import * as CONSTANTS from "../src/constants.ts";

const response = { message: "test should works" };
globalThis.fetch = (() => Promise.resolve({
  json: () => response
})) as unknown as typeof fetch;
const json = await getJSON("random");

assert.equal(json, response, "getJSON should works");

const FLAGS = [
  {
    emoji: "🌍",
    title: "hasExternalCapacity"
  },
  {
    emoji: "🚧",
    title: "hasWarnings"
  },
  {
    emoji: "🐲",
    title: "hasNativeCode"
  }
];

const titles = FLAGS.map((flag) => flag.title);

assert.equal(
  getFlagsEmojisInlined(titles, new Set()),
  " 🌍 🚧 🐲",
  "getFlagsEmojisInlined without flag to ignore"
);

assert.equal(
  getFlagsEmojisInlined(titles, new Set(["hasWarnings"])),
  " 🌍 🐲",
  "getFlagsEmojisInlined with flag to ignore"
);

assert.equal(
  getNodeColor({ id: 0 }),
  CONSTANTS.COLORS.LIGHT.SELECTED,
  "id 0 is the root package (so by default he is highlighted as selected)."
);

assert.equal(
  getNodeColor({ id: 1, hasWarnings: true }),
  CONSTANTS.COLORS.LIGHT.WARN,
  "hasWarnings is true, so the node is highlighted as warning."
);

assert.equal(
  getNodeColor({ id: 1, hasWarnings: false }),
  CONSTANTS.COLORS.LIGHT.DEFAULT,
  "the node is highlighted as default."
);

assert.equal(
  getNodeColor({ id: 1, hasWarnings: false, theme: "DARK" }),
  CONSTANTS.COLORS.DARK.DEFAULT,
  "the node is highlighted as default and the theme is DARK."
);
