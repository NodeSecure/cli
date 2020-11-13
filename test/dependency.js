"use strict";

// Require Third-party Dependencies
const is = require("@slimio/is");

// Require Internal Dependencies
const Dependency = require("../src/dependency.class");

test("Dependency class should act as expected by assertions", () => {
    expect(is.classObject(Dependency)).toStrictEqual(true);

    const dep = new Dependency("semver", "1.0.0");
    expect(dep.parent).toMatchObject({});
    expect(dep.name).toStrictEqual("semver");
    expect(dep.version).toStrictEqual("1.0.0");
    expect(dep.fullName).toStrictEqual("semver 1.0.0");
    expect(Reflect.ownKeys(dep)).toHaveLength(5);

    const flagOne = dep.flags;
    const flagTwo = dep.flags;
    expect(flagOne).toMatchObject(flagTwo);
    expect(flagOne === flagTwo).toStrictEqual(false);
});

test("Dependency children should write his parent as usedBy when exported", () => {
    const semverDep = new Dependency("semver", "1.0.0");

    const testDep = new Dependency("test", "1.0.0", semverDep);

    expect(testDep.parent).toMatchObject({
        [semverDep.name]: semverDep.version
    });

    const flatDep = testDep.exportAsPlainObject(void 0);
    expect(flatDep["1.0.0"].usedBy).toMatchObject({
        [semverDep.name]: semverDep.version
    });
});

test("Create a GIT Dependency (flags.isGit must be set to true)", () => {
    const semverDep = new Dependency("semver", "1.0.0").isGit();
    expect(semverDep.gitUrl).toStrictEqual(null);
    const flatSemver = semverDep.exportAsPlainObject(void 0);
    expect(flatSemver["1.0.0"].flags.includes("isGit")).toStrictEqual(true);

    const mochaDep = new Dependency("mocha", "1.0.0").isGit("https://github.com/mochajs/mocha");
    expect(mochaDep.gitUrl).toStrictEqual("https://github.com/mochajs/mocha");
    const flatMocha = mochaDep.exportAsPlainObject(void 0);
    expect(flatMocha["1.0.0"].flags.includes("isGit")).toStrictEqual(true);
});
