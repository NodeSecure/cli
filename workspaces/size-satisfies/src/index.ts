// Import Third-party Dependencies
import bytes from "bytes";

// CONSTANTS
const kOperators = {
  ">=": (lh, rh) => lh >= rh,
  "<=": (lh, rh) => lh <= rh,
  ">": (lh, rh) => lh > rh,
  "<": (lh, rh) => lh < rh,
  "=": (lh, rh) => lh === rh
} satisfies Record<string, (lh: number, rh: number) => boolean>;

export function sizeSatisfies(
  pattern: string,
  size: number | string
): boolean {
  const localSize = typeof size === "number" ?
    size :
    bytes(size) ?? 0;

  const regexResult = /^(?<operator>[><=]{1,2})\s*(?<patternSize>.*)/g.exec(pattern);
  if (
    regexResult === null ||
    regexResult.groups === undefined
  ) {
    return false;
  }
  const { operator, patternSize } = regexResult.groups;

  return kOperators[operator as keyof typeof kOperators](
    localSize,
    bytes(patternSize) ?? 0
  );
}

export default sizeSatisfies;
