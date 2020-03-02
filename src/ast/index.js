"use strict";

// Require Third-party Dependencies
const { walk } = require("estree-walker");
const meriyah = require("meriyah");
const safeRegex = require("safe-regex");

// Require Internal Dependencies
const helpers = require("./helpers");
const ASTDeps = require("./ASTDeps");

// CONSTANTS
const kMainModuleStr = "process.mainModule.";

function warn(kind = "unsafe-import", { start, end }) {
    return { kind, start, end };
}

/**
 * @typedef {object} ASTSummary
 * @property {ASTDeps} dependencies
 * @property {any[]} warnings
 * @property {boolean} isOneLineRequire
 */

/**
 * @function searchRuntimeDependencies
 * @description Parse a script, get an AST and search for require occurence!
 * @param {!string} str file content (encoded as utf-8)
 * @param {object} [options]
 * @param {boolean} [options.module=false] enable sourceType module
 * @returns {ASTSummary}
 */
function searchRuntimeDependencies(str, options = Object.create(null)) {
    const { module = false } = options;
    const identifiers = new Map();
    const dependencies = new ASTDeps();
    const warnings = [];

    if (str.charAt(0) === "#") {
        // eslint-disable-next-line
        str = str.slice(str.indexOf("\n"));
    }
    const { body } = meriyah.parseScript(str, {
        next: true,
        module: Boolean(module),
        loc: true
    });

    walk(body, {
        enter(node) {
            if (node.type === "TryStatement") {
                dependencies.isInTryStmt = true;
            }
            else if (node.type === "CatchClause") {
                dependencies.isInTryStmt = false;
            }

            if (helpers.isLiteralRegex(node)) {
                if (!safeRegex(node.regex.pattern)) {
                    warnings.push(warn("unsafe-regex", node.loc));
                }
            }
            else if (helpers.isRegexConstructor(node)) {
                const arg = node.arguments[0];
                const pattern = helpers.isLiteralRegex(arg) ? arg.regex.pattern : arg.value;

                if (!safeRegex(pattern)) {
                    warnings.push(warn("unsafe-regex", node.loc));
                }
            }

            if (helpers.isVariableDeclarator(node)) {
                identifiers.set(node.id.name, node.init.value);
            }

            if (!module && (helpers.isRequireStatment(node) || helpers.isRequireResolve(node))) {
                const arg = node.arguments[0];
                if (arg.type === "Identifier") {
                    if (identifiers.has(arg.name)) {
                        dependencies.add(identifiers.get(arg.name));
                    }
                    else {
                        warnings.push(warn("unsafe-import", node.loc));
                    }
                }
                else if (arg.type === "Literal") {
                    dependencies.add(arg.value);
                }
                else if (arg.type === "ArrayExpression") {
                    const value = helpers.arrExprToString(arg.elements, identifiers);
                    if (value.trim() === "") {
                        warnings.push(warn("unsafe-import", node.loc));
                    }
                    else {
                        dependencies.add(value);
                    }
                }
                else if (arg.type === "BinaryExpression" && arg.operator === "+") {
                    const value = helpers.concatBinaryExpr(arg, identifiers);
                    if (value === null) {
                        warnings.push(warn("unsafe-import", node.loc));
                    }
                    else {
                        dependencies.add(value);
                    }
                }
                else {
                    warnings.push(warn("unsafe-import", node.loc));
                }
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
        }
    });

    return {
        dependencies,
        warnings,
        isOneLineRequire: !module && body.length === 1 && dependencies.size === 1
    };
}

module.exports = { searchRuntimeDependencies };
