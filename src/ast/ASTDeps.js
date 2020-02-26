"use strict";

class ASTDeps {
    constructor() {
        this.isInTryStmt = false;
        this.dependencies = Object.create(null);
    }

    add(depName) {
        this.dependencies[depName] = {
            inTry: this.isInTryStmt
        };
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
