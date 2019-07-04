"use strict";

// Require Third-party Dependencies
const { walk } = require("estree-walker");
const cherow = require("cherow");

// CONSTANTS
const BINARY_EXPR_TYPES = new Set(["Literal", "BinaryExpression", "Identifier"]);

function isRequireStatment(node) {
    if (node.type !== "CallExpression" || node.callee.name !== "require") {
        return false;
    }

    return true;
}

function isVariableDeclarator(node) {
    if (node.type !== "VariableDeclarator" ||
        node.init === null ||
        node.init.type !== "Literal" ||
        node.id.type !== "Identifier") {
        return false;
    }

    return true;
}

function concatBinaryExpr(node, identifiers) {
    const { left, right } = node;
    if (!BINARY_EXPR_TYPES.has(left.type) || !BINARY_EXPR_TYPES.has(right.type)) {
        return null;
    }
    let str = "";

    for (const childNode of [left, right]) {
        switch (childNode.type) {
            case "BinaryExpression": {
                const value = concatBinaryExpr(childNode, identifiers);
                if (value !== null) {
                    str += value;
                }
                break;
            }
            case "Literal":
                str += childNode.value;
                break;
            case "Identifier":
                if (identifiers.has(childNode.name)) {
                    str += identifiers.get(childNode.name);
                }
                break;
        }
    }

    return str;
}

/**
 * @func searchRuntimeDependencies
 * @desc Parse a script, get an AST and search for require occurence!
 * @param {!String} str file content (encoded as utf-8)
 * @returns {Set<String>}
 */
function searchRuntimeDependencies(str) {
    const identifiers = new Map();
    const runtimeDep = new Set();

    if (str.charAt(0) === "#") {
        // eslint-disable-next-line
        str = str.slice(str.indexOf("\n"));
    }
    const { body } = cherow.parseScript(str, { next: true });

    walk(body, {
        enter(node) {
            // console.log(JSON.stringify(node, null, 2));
            // console.log("-------------------------");
            try {
                if (isRequireStatment(node)) {
                    const arg = node.arguments[0];
                    if (arg.type === "Identifier") {
                        if (identifiers.has(arg.name)) {
                            runtimeDep.add(identifiers.get(arg.name));
                        }
                    }
                    else if (arg.type === "Literal") {
                        runtimeDep.add(arg.value);
                    }
                    else if (arg.type === "BinaryExpression" && arg.operator === "+") {
                        const value = concatBinaryExpr(arg, identifiers);
                        if (value !== null) {
                            runtimeDep.add(value);
                        }
                    }
                }
                else if (isVariableDeclarator(node)) {
                    identifiers.set(node.id.name, node.init.value);
                }
            }
            catch (err) {
                // Ignore
            }
        }
    });

    return runtimeDep;
}

module.exports = { searchRuntimeDependencies };
