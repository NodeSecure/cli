// Import Third-party Dependencies
import tap from "tap";

// Import Internal Dependencies
import { getFlagsEmojisInlined, getJSON, getNodeColor } from "../src/utils.js";
import * as CONSTANTS from "../src/constants.js";

const response = { message: "test should works" };
global.fetch = () => Promise.resolve({ json: () => response });
const json = await getJSON("random");

tap.equal(json, response, "getJSON should works");

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

tap.equal(
  getFlagsEmojisInlined(titles, new Set()),
  " 🌍 🚧 🐲",
  "getFlagsEmojisInlined without flag to ignore"
);

tap.equal(
  getFlagsEmojisInlined(titles, new Set(["hasWarnings"])),
  " 🌍 🐲",
  "getFlagsEmojisInlined with flag to ignore"
);

tap.equal(
  getNodeColor(0),
  CONSTANTS.COLORS.LIGHT.SELECTED,
  "id 0 is the root package (so by default he is highlighted as selected)."
);

tap.equal(
  getNodeColor(1, true),
  CONSTANTS.COLORS.LIGHT.WARN,
  "hasWarnings is true, so the node is highlighted as warning."
);

tap.equal(
  getNodeColor(1, false),
  CONSTANTS.COLORS.LIGHT.DEFAULT,
  "the node is highlighted as default."
);

tap.equal(
  getNodeColor(1, false, "DARK"),
  CONSTANTS.COLORS.DARK.DEFAULT,
  "the node is highlighted as default and the theme is DARK."
);
