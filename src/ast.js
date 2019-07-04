"use strict";

// Require Third-party Dependencies
const { walk } = require("estree-walker");
const cherow = require("cherow");

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

    // TODO: improve non-literal tracking
    walk(body, {
        enter(node) {
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
