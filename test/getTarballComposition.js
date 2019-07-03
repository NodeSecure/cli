"use strict";

const path = require("path");

const { getTarballComposition } = require("../src/utils");

const fixture = path.join(__dirname, "fixtures/getTarballComposition");

test("should return the composition of a directory", async() => {
    const composition = await getTarballComposition(fixture);
    expect(composition).toMatchObject({
        ext: new Set(["", ".js", ".json", ".txt"]),
        size: 50
    });
    expect(composition.files).toHaveLength(4);
    expect(composition.files[0]).toMatch(/one(\/|\\)README/);
});
