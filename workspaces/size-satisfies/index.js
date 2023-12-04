// Require Third-party Dependencies
import bytes from "bytes";

// CONSTANTS
const kOperators = {
  ">=": (lh, rh) => lh >= rh,
  "<=": (lh, rh) => lh <= rh,
  ">": (lh, rh) => lh > rh,
  "<": (lh, rh) => lh < rh,
  "=": (lh, rh) => lh === rh
};

/**
 * @function sizeSatisfies
 * @param {!string} pattern
 * @param {!(number | string)} size
 * @returns {boolean}
 */
function sizeSatisfies(pattern, size) {
  const localSize = typeof size === "number" ? size : bytes(size);
  const regexResult = /^(?<operator>[><=]{1,2})\s*(?<patternSize>.*)/g.exec(pattern);
  if (regexResult === null) {
    return false;
  }
  const { operator, patternSize } = regexResult.groups;

  return kOperators[operator](localSize, bytes(patternSize));
}

export default sizeSatisfies;
