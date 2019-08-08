"use strict";

// Require Third-party Dependencies
const { walk } = require("estree-walker");
const meriyah = require("meriyah");

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
 * @typedef {object} ASTSummary
 * @property {Set<string>} dependencies
 * @property {boolean} isSuspect
 */

/**
 * @function searchRuntimeDependencies
 * @description Parse a script, get an AST and search for require occurence!
 * @param {!string} str file content (encoded as utf-8)
 * @returns {ASTSummary}
 */
function searchRuntimeDependencies(str) {
    const identifiers = new Map();
    const dependencies = new Set();
    let isSuspect = false;

    if (str.charAt(0) === "#") {
        // eslint-disable-next-line
        str = str.slice(str.indexOf("\n"));
    }
    const { body } = meriyah.parseScript(str, { next: true });

    walk(body, {
        enter(node) {
            // console.log(JSON.stringify(node, null, 2));
            // console.log("-------------------------");
            try {
                if (isRequireStatment(node)) {
                    const arg = node.arguments[0];
                    if (arg.type === "Identifier") {
                        if (identifiers.has(arg.name)) {
                            dependencies.add(identifiers.get(arg.name));
                        }
                    }
                    else if (arg.type === "Literal") {
                        dependencies.add(arg.value);
                    }
                    else if (arg.type === "BinaryExpression" && arg.operator === "+") {
                        const value = concatBinaryExpr(arg, identifiers);
                        if (value === null) {
                            isSuspect = true;
                        }
                        else {
                            dependencies.add(value);
                        }
                    }
                    else {
                        isSuspect = true;
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

    return {
        dependencies,
        isSuspect
    };
}

module.exports = { searchRuntimeDependencies };
