"use strict";

// Require Third-party Dependencies
const is = require("@slimio/is");

// Require Internal Dependencies
const ASTDeps = require("../src/ast/ASTDeps");

test("assert ASTDeps class default properties and values", () => {
    const deps = new ASTDeps();

    expect(deps.isInTryStmt).toStrictEqual(false);
    expect(is.plainObject(deps.dependencies)).toStrictEqual(true);
    expect(deps.size).toStrictEqual(0);
    expect([...deps]).toEqual([]);
});

test("add values to ASTDeps instance", () => {
    const deps = new ASTDeps();

    deps.add("foo");
    deps.isInTryStmt = true;
    deps.add("boo");
    expect(deps.size).toStrictEqual(2);
    expect([...deps]).toEqual(["foo", "boo"]);
    expect([...deps.getDependenciesInTryStatement()]).toEqual(["boo"]);
});

test("delete values from ASTDeps instance", () => {
    const deps = new ASTDeps();

    deps.add("foo");
    deps.removeByName("foo");
    deps.removeByName("boo");
    expect(deps.size).toStrictEqual(0);
});
