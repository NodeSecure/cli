/* eslint-disable lines-between-class-members */
"use strict";

// Require Third-party Dependencies
const cloneDeep = require("klona");

class Dependency {
    gitUrl = null;
    dependencyCount = 0;
    warnings = [];

    #parent = null;
    #flags = Object.preventExtensions({
        isGit: false,
        hasManifest: true,
        isDeprecated: false,
        hasWarnings: false,
        hasLicense: false,
        hasMultipleLicenses: false,
        hasIndirectDependencies: false,
        hasMinifiedCode: false,
        hasCustomResolver: false,
        hasDependencies: false,
        hasExternalCapacity: false,
        hasMissingOrUnusedDependency: false,
        hasOutdatedDependency: false,
        hasScript: false,
        hasBannedFile: false,
        hasValidIntegrity: true
    });

    constructor(name, version, parent = null) {
        this.name = name;
        this.version = version;
        this.#parent = parent;
    }

    get fullName() {
        return `${this.name} ${this.version}`;
    }

    isGit(url) {
        this.#flags.isGit = true;
        if (typeof url === "string") {
            this.gitUrl = url;
        }

        return this;
    }

    exportAsPlainObject(customId) {
        const parent = this.parent;
        this.hasWarnings = this.warnings.length > 0;

        return {
            [this.version]: {
                id: typeof customId === "number" ? customId : Dependency.currentId++,
                usedBy: parent === null ? {} : { [parent.name]: parent.version },
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

    get parent() {
        return this.#parent === null ? null : cloneDeep(this.#parent);
    }

    set parent(value) {
        this.#parent = value instanceof Dependency ? { name: value.name, version: value.version } : null;
    }

    get flags() {
        return cloneDeep(this.#flags);
    }

    get hasWarnings() {
        return this.#flags.hasWarnings;
    }

    set hasWarnings(value) {
        this.#flags.hasWarnings = value;
    }

    get hasValidIntegrity() {
        return this.#flags.hasValidIntegrity;
    }

    set hasValidIntegrity(value) {
        this.#flags.hasValidIntegrity = value;
    }


    get hasBannedFile() {
        return this.#flags.hasBannedFile;
    }

    set hasBannedFile(value) {
        this.#flags.hasBannedFile = value;
    }

    get hasMissingOrUnusedDependency() {
        return this.#flags.hasMissingOrUnusedDependency;
    }

    set hasMissingOrUnusedDependency(value) {
        this.#flags.hasMissingOrUnusedDependency = value;
    }

    get hasOutdatedDependency() {
        return this.#flags.hasOutdatedDependency;
    }

    set hasOutdatedDependency(value) {
        this.#flags.hasOutdatedDependency = value;
    }

    get hasManifest() {
        return this.#flags.hasManifest;
    }

    set hasManifest(value) {
        this.#flags.hasManifest = value;
    }

    get isDeprecated() {
        return this.#flags.isDeprecated;
    }

    set isDeprecated(value) {
        this.#flags.isDeprecated = value;
    }

    get hasLicense() {
        return this.#flags.hasLicense;
    }

    set hasLicense(value) {
        this.#flags.hasLicense = value;
    }

    get hasIndirectDependencies() {
        return this.#flags.hasIndirectDependencies;
    }

    set hasIndirectDependencies(value) {
        this.#flags.hasIndirectDependencies = value;
    }

    get hasMinifiedCode() {
        return this.#flags.hasMinifiedCode;
    }

    set hasMinifiedCode(value) {
        this.#flags.hasMinifiedCode = value;
    }

    get hasCustomResolver() {
        return this.#flags.hasCustomResolver;
    }

    set hasCustomResolver(value) {
        this.#flags.hasCustomResolver = value;
    }

    get hasScript() {
        return this.#flags.hasScript;
    }

    set hasScript(value) {
        this.#flags.hasScript = value;
    }

    get hasDependencies() {
        return this.#flags.hasDependencies;
    }

    set hasDependencies(value) {
        this.#flags.hasDependencies = value;
    }
}

Dependency.currentId = 1;

module.exports = Dependency;
