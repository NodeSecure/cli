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
    expect(dep.fullName).toStrictEqual("semver 1.0.0");
    expect(dep.hasManifest).toStrictEqual(true);
    expect(dep.hasCustomResolver).toStrictEqual(false);
    expect(dep.isDeprecated).toStrictEqual(false);
    expect(dep.hasWarnings).toStrictEqual(false);
    expect(dep.hasLicense).toStrictEqual(false);
    expect(dep.hasMinifiedCode).toStrictEqual(false);
    expect(dep.hasScript).toStrictEqual(false);
    expect(dep.hasDependencies).toStrictEqual(false);
    expect(dep.hasIndirectDependencies).toStrictEqual(false);
    expect(dep.hasOutdatedDependency).toStrictEqual(false);
    expect(dep.hasMissingOrUnusedDependency).toStrictEqual(false);
    expect(dep.hasBannedFile).toStrictEqual(false);
    expect(Reflect.ownKeys(dep)).toHaveLength(5);

    const flagOne = dep.flags;
    const flagTwo = dep.flags;
    expect(flagOne).toMatchObject(flagTwo);
    expect(flagOne === flagTwo).toStrictEqual(false);
});

test("Dependency children should write his parent as usedBy when flatten", () => {
    const semverDep = new Dependency("semver", "1.0.0");

    const testDep = new Dependency("test", "1.0.0");
    testDep.parent = semverDep;

    expect(testDep.parent).toMatchObject({
        name: semverDep.name,
        version: semverDep.version
    });

    const flatDep = testDep.flatten(void 0);
    expect(flatDep["1.0.0"].usedBy).toMatchObject({
        [semverDep.name]: semverDep.version
    });
});

test("Create a GIT Dependency (flags.isGit must be set to true)", () => {
    const semverDep = new Dependency("semver", "1.0.0").isGit();
    expect(semverDep.gitUrl).toStrictEqual(null);
    const flatSemver = semverDep.flatten(void 0);
    expect(flatSemver["1.0.0"].flags.isGit).toStrictEqual(true);

    const mochaDep = new Dependency("mocha", "1.0.0").isGit("https://github.com/mochajs/mocha");
    expect(mochaDep.gitUrl).toStrictEqual("https://github.com/mochajs/mocha");
    const flatMocha = mochaDep.flatten(void 0);
    expect(flatMocha["1.0.0"].flags.isGit).toStrictEqual(true);
});

test("Set all flags on one given Dependency", () => {
    const semverDep = new Dependency("semver", "1.0.0");

    semverDep.warnings.push({});
    semverDep.hasCustomResolver = true;
    semverDep.hasScript = true;
    semverDep.hasDependencies = true;
    semverDep.hasMinifiedCode = true;
    semverDep.hasManifest = false;
    semverDep.isDeprecated = true;
    semverDep.hasLicense = true;
    semverDep.hasIndirectDependencies = true;
    semverDep.hasMissingOrUnusedDependency = true;
    semverDep.hasBannedFile = true;

    const flatSemver = semverDep.flatten(void 0);
    expect(flatSemver["1.0.0"].flags).toMatchObject({
        isGit: false,
        hasCustomResolver: true,
        hasScript: true,
        hasDependencies: true,
        hasMinifiedCode: true,
        hasManifest: false,
        hasWarnings: true,
        isDeprecated: true,
        hasLicense: true,
        hasIndirectDependencies: true,
        hasExternalCapacity: false,
        hasMissingOrUnusedDependency: true,
        hasOutdatedDependency: false,
        hasBannedFile: true
    });
});
