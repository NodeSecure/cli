"use strict";

class ASTDeps {
    constructor() {
        this.isInTryStmt = false;
        this.dependencies = Object.create(null);
    }

    removeByName(name) {
        if (Reflect.has(this.dependencies, name)) {
            delete this.dependencies[name];
        }
    }

    add(depName) {
        this.dependencies[depName] = {
            inTry: this.isInTryStmt
        };
    }

    get size() {
        return Object.keys(this.dependencies).length;
    }

    * getDependenciesInTryStatement() {
        for (const [depName, props] of Object.entries(this.dependencies)) {
            if (props.inTry === true) {
                yield depName;
            }
        }
    }

    * [Symbol.iterator]() {
        yield* Object.keys(this.dependencies);
    }
}

module.exports = ASTDeps;
