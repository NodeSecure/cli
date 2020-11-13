/* eslint-disable lines-between-class-members */
"use strict";

class Dependency {
    gitUrl = null;
    dependencyCount = 0;
    warnings = [];

    #flags = new Set();
    #parent = null;

    constructor(name, version, parent = null) {
        this.name = name;
        this.version = version;

        if (parent !== null) {
            parent.dependencyCount++;
        }
        this.#parent = parent;
    }

    get fullName() {
        return `${this.name} ${this.version}`;
    }

    get flags() {
        return [...this.#flags];
    }

    get parent() {
        return this.#parent === null ? {} : { [this.#parent.name]: this.#parent.version };
    }

    addFlag(flagName, predicate = true) {
        if (typeof flagName !== "string") {
            throw new TypeError("flagName argument must be typeof string");
        }

        if (predicate) {
            if (flagName === "hasDependencies" && this.#parent !== null) {
                this.#parent.addFlag("hasIndirectDependencies");
            }

            this.#flags.add(flagName);
        }
    }

    isGit(url) {
        this.#flags.add("isGit");
        if (typeof url === "string") {
            this.gitUrl = url;
        }

        return this;
    }

    exportAsPlainObject(customId) {
        if (this.warnings.length > 0) {
            this.addFlag("hasWarnings");
        }

        return {
            [this.version]: {
                id: typeof customId === "number" ? customId : Dependency.currentId++,
                usedBy: this.parent,
                flags: this.flags,
                description: "",
                size: 0,
                author: "N/A",
                warnings: this.warnings,
                composition: {
                    extensions: [],
                    files: [],
                    minified: [],
                    unused: [],
                    missing: [],
                    required_files: [],
                    required_nodejs: [],
                    required_thirdparty: []
                },
                license: "unkown license",
                gitUrl: this.gitUrl
            },
            versions: [this.version],
            vulnerabilities: [],
            metadata: {
                dependencyCount: this.dependencyCount,
                publishedCount: 0,
                lastUpdateAt: null,
                lastVersion: null,
                hasChangedAuthor: false,
                hasManyPublishers: false,
                hasReceivedUpdateInOneYear: true,
                homepage: null,
                author: null,
                publishers: [],
                maintainers: []
            }
        };
    }
}

Dependency.currentId = 1;

module.exports = Dependency;
