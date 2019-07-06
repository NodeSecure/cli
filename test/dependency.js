"use strict";

// Require Third-party Dependencies
const is = require("@slimio/is");

// Require Internal Dependencies
const Dependency = require("../src/dependency.class");

test("Dependency class should act as expected by assertions", () => {
    expect(is.classObject(Dependency)).toStrictEqual(true);

    const dep = new Dependency("semver", "1.0.0");
    expect(dep.parent).toStrictEqual(null);
    expect(dep.name).toStrictEqual("semver");
    expect(dep.version).toStrictEqual("1.0.0");
    expect(Reflect.ownKeys(dep)).toHaveLength(4);

    const flagOne = dep.flags;
    const flagTwo = dep.flags;
    expect(flagOne).toMatchObject(flagTwo);
    expect(flagOne === flagTwo).toStrictEqual(false);
});
