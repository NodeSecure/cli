"use strict";

// Require Third-party Dependencies
const cloneDeep = require("lodash.clonedeep");

// Symbols
const SYM_PARENT = Symbol("symDependencyParent");
const SYM_FLAGS = Symbol("symDependencyFlags");

class Dependency {
    constructor(name, version, parent = null) {
        this.name = name;
        this.version = version;
        this.gitUrl = null;
        this.dependencyCount = 0;
        this.warnings = [];

        const flags = {
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
        };
        Object.preventExtensions(flags);

        Object.defineProperty(this, SYM_PARENT, { value: parent, writable: true, configurable: true });
        Object.defineProperty(this, SYM_FLAGS, { value: flags });
    }

    get fullName() {
        return `${this.name} ${this.version}`;
    }

    isGit(url) {
        this[SYM_FLAGS].isGit = true;
        if (typeof url === "string") {
            this.gitUrl = url;
        }

        return this;
    }

    flatten(customId) {
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
        return this[SYM_PARENT] === null ? null : cloneDeep(this[SYM_PARENT]);
    }

    set parent(value) {
        this[SYM_PARENT] = value instanceof Dependency ? { name: value.name, version: value.version } : null;
    }

    get flags() {
        return cloneDeep(this[SYM_FLAGS]);
    }

    get hasWarnings() {
        return this[SYM_FLAGS].hasWarnings;
    }

    set hasWarnings(value) {
        this[SYM_FLAGS].hasWarnings = value;
    }

    get hasValidIntegrity() {
        return this[SYM_FLAGS].hasValidIntegrity;
    }

    set hasValidIntegrity(value) {
        this[SYM_FLAGS].hasValidIntegrity = value;
    }


    get hasBannedFile() {
        return this[SYM_FLAGS].hasBannedFile;
    }

    set hasBannedFile(value) {
        this[SYM_FLAGS].hasBannedFile = value;
    }

    get hasMissingOrUnusedDependency() {
        return this[SYM_FLAGS].hasMissingOrUnusedDependency;
    }

    set hasMissingOrUnusedDependency(value) {
        this[SYM_FLAGS].hasMissingOrUnusedDependency = value;
    }

    get hasOutdatedDependency() {
        return this[SYM_FLAGS].hasOutdatedDependency;
    }

    set hasOutdatedDependency(value) {
        this[SYM_FLAGS].hasOutdatedDependency = value;
    }

    get hasManifest() {
        return this[SYM_FLAGS].hasManifest;
    }

    set hasManifest(value) {
        this[SYM_FLAGS].hasManifest = value;
    }

    get isDeprecated() {
        return this[SYM_FLAGS].isDeprecated;
    }

    set isDeprecated(value) {
        this[SYM_FLAGS].isDeprecated = value;
    }

    get hasLicense() {
        return this[SYM_FLAGS].hasLicense;
    }

    set hasLicense(value) {
        this[SYM_FLAGS].hasLicense = value;
    }

    get hasIndirectDependencies() {
        return this[SYM_FLAGS].hasIndirectDependencies;
    }

    set hasIndirectDependencies(value) {
        this[SYM_FLAGS].hasIndirectDependencies = value;
    }

    get hasMinifiedCode() {
        return this[SYM_FLAGS].hasMinifiedCode;
    }

    set hasMinifiedCode(value) {
        this[SYM_FLAGS].hasMinifiedCode = value;
    }

    get hasCustomResolver() {
        return this[SYM_FLAGS].hasCustomResolver;
    }

    set hasCustomResolver(value) {
        this[SYM_FLAGS].hasCustomResolver = value;
    }

    get hasScript() {
        return this[SYM_FLAGS].hasScript;
    }

    set hasScript(value) {
        this[SYM_FLAGS].hasScript = value;
    }

    get hasDependencies() {
        return this[SYM_FLAGS].hasDependencies;
    }

    set hasDependencies(value) {
        this[SYM_FLAGS].hasDependencies = value;
    }
}

Dependency.currentId = 1;

module.exports = Dependency;
