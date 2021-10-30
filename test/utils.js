// Import Internal Dependencies
import * as utils from "../src/utils";

describe("formatBytes", () => {
  it("should return '0 B' if bytes argument is equal zero", () => {
    expect(utils.formatBytes(0)).toStrictEqual("0 B");
  });

  it("should format 10 bytes", () => {
    expect(utils.formatBytes(10)).toStrictEqual("10 B");
  });

  it("should format 3000 bytes in KB with two fixed number", () => {
    expect(utils.formatBytes(3000)).toStrictEqual("2.93 KB");
  });

  it("should format 822_223_900 bytes in MB", () => {
    expect(utils.formatBytes(822_223_900)).toStrictEqual("784.13 MB");
  });
});

describe("locationToString", () => {
  it("should return the location array in string syntax", () => {
    const str = utils.locationToString([[1, 2], [2, 4]]);
    expect(str).toStrictEqual("[1:2] - [2:4]");
  });

  it("should ignore elements after length 1", () => {
    const str = utils.locationToString([[1, 2, 3], [2, 4, 10], [50]]);
    expect(str).toStrictEqual("[1:2] - [2:4]");
  });
});
