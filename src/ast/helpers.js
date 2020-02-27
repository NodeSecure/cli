"use strict";

// CONSTANTS
const BINARY_EXPR_TYPES = new Set(["Literal", "BinaryExpression", "Identifier"]);

function isRequireResolve(node) {
    if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") {
        return false;
    }

    return node.callee.object.name === "require" && node.callee.property.name === "resolve";
}

function isRequireStatment(node) {
    return node.type === "CallExpression" && node.callee.name === "require";
}

function isRegexConstructor(node) {
    if (node.type !== "NewExpression" || node.callee.type !== "Identifier") {
        return false;
    }

    return node.callee.name === "RegExp";
}

function isLiteralRegex(node) {
    return node.type === "Literal" && Reflect.has(node, "regex");
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

function arrExprToString(elements, identifiers = null) {
    let ret = "";

    for (const row of elements) {
        if (row.type === "Literal") {
            const value = Number(row.value);
            ret += Number.isNaN(value) ? row.value : String.fromCharCode(value);
        }
        else if (row.type === "Identifier" && identifiers !== null) {
            if (identifiers.has(row.name)) {
                ret += identifiers.get(row.name);
            }
        }
    }

    return ret;
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
            case "ArrayExpression": {
                str += arrExprToString(childNode.elements, identifiers);
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

function getMemberExprName(node) {
    let name = "";
    switch (node.object.type) {
        case "MemberExpression":
            name += getMemberExprName(node.object);
            break;
        case "Identifier":
            name += node.object.name;
            break;
        case "Literal":
            name += node.object.value;
            break;
    }

    switch (node.property.type) {
        case "Identifier":
            name += `.${node.property.name}`;
            break;
        case "Literal":
            name += `.${node.property.value}`;
            break;
    }

    return name;
}

module.exports = {
    isRequireResolve,
    isRequireStatment,
    isLiteralRegex,
    isRegexConstructor,
    isVariableDeclarator,
    concatBinaryExpr,
    arrExprToString,
    getMemberExprName
};
