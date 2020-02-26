"use strict";

// Require Third-party Dependencies
const { walk } = require("estree-walker");
const meriyah = require("meriyah");

// Require Internal Dependencies
const helpers = require("./helpers");
const ASTDeps = require("./ASTDeps");

// CONSTANTS
const kMainModuleStr = "process.mainModule.";

/**
 * @typedef {object} ASTSummary
 * @property {ASTDeps} dependencies
 * @property {boolean} isSuspect
 * @property {boolean} isOneLineRequire
 */

/**
 * @function searchRuntimeDependencies
 * @description Parse a script, get an AST and search for require occurence!
 * @param {!string} str file content (encoded as utf-8)
 * @param {boolean} [module=false] enable sourceType module
 * @returns {ASTSummary}
 */
function searchRuntimeDependencies(str, module = false) {
    const identifiers = new Map();
    const dependencies = new ASTDeps();
    let isSuspect = false;

    if (str.charAt(0) === "#") {
        // eslint-disable-next-line
        str = str.slice(str.indexOf("\n"));
    }
    const { body } = meriyah.parseScript(str, { next: true, module });

    walk(body, {
        enter(node) {
            try {
                if (!module && (helpers.isRequireStatment(node) || helpers.isRequireResolve(node))) {
                    const arg = node.arguments[0];
                    if (arg.type === "Identifier") {
                        if (identifiers.has(arg.name)) {
                            dependencies.add(identifiers.get(arg.name));
                        }
                        else {
                            isSuspect = true;
                        }
                    }
                    else if (arg.type === "Literal") {
                        dependencies.add(arg.value);
                    }
                    else if (arg.type === "ArrayExpression") {
                        const value = helpers.arrExprToString(arg.elements, identifiers);
                        if (value.trim() === "") {
                            isSuspect = true;
                        }
                        else {
                            dependencies.add(value);
                        }
                    }
                    else if (arg.type === "BinaryExpression" && arg.operator === "+") {
                        const value = helpers.concatBinaryExpr(arg, identifiers);
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
                else if (node.type === "TryStatement") {
                    dependencies.isInTryStmt = true;
                }
                else if (node.type === "CatchClause") {
                    dependencies.isInTryStmt = false;
                }
                else if (module && node.type === "ImportDeclaration") {
                    const source = node.source;

                    if (source.type === "Literal") {
                        dependencies.add(source.value);
                    }
                }
                else if (node.type === "MemberExpression") {
                    const memberName = helpers.getMemberExprName(node);
                    if (memberName.startsWith(kMainModuleStr)) {
                        dependencies.add(memberName.slice(kMainModuleStr.length));
                    }
                }
                else if (helpers.isVariableDeclarator(node)) {
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
        isSuspect,
        isOneLineRequire: !module && body.length === 1 && dependencies.size === 1
    };
}

module.exports = { searchRuntimeDependencies };
