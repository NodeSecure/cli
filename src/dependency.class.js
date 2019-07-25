"use strict";

// Require Third-party Dependencies
const cloneDeep = require("lodash.clonedeep");

// Symbols
const SYM_PARENT = Symbol("symDependencyParent");
const SYM_FLAGS = Symbol("symDependencyFlags");

/**
 * @class Dependency
 */
class Dependency {
    /**
     * @constructor
     * @memberof Dependency#
     * @param {!String} name Dependency name
     * @param {!String} version Dependency version
     * @param {Dependency | null} [parent] Dependency parent
     */
    constructor(name, version, parent = null) {
        this.name = name;
        this.version = version;
        const flags = {
            hasManifest: true,
            isDeprecated: false,
            hasSuspectImport: false,
            hasLicense: false,
            hasIndirectDependencies: false,
            hasMinifiedCode: false,
            hasCustomResolver: false,
            hasDependencies: false
        };
        Object.preventExtensions(flags);

        Object.defineProperty(this, SYM_PARENT, { value: parent, writable: true, configurable: true });
        Object.defineProperty(this, SYM_FLAGS, { value: flags });
    }

    /**
     * @method flatten
     * @memberof Dependency#
     * @param {number} [customId] customid
     * @returns {void}
     */
    flatten(customId) {
        const parent = this.parent;

        return {
            [this.version]: {
                id: typeof customId === "number" ? customId : Dependency.currentId++,
                usedBy: parent === null ? {} : { [parent.name]: parent.version },
                flags: this.flags,
                description: "",
                size: 0,
                author: "N/A",
                composition: {
                    extensions: [],
                    files: [],
                    minified: [],
                    required: [],
                    required_builtin: []
                },
                licenseFrom: "package.json",
                license: ""
            },
            metadata: {
                publishedCount: 0,
                lastUpdateAt: null,
                lastVersion: null,
                hasChangedAuthor: false,
                hasManyPublishers: false,
                homepage: "",
                author: "N/A",
                publishers: [],
                authors: []
            }
        };
    }

    /**
     * @memberof Dependency#
     * @member {Dependency} parent
     */
    get parent() {
        return this[SYM_PARENT] === null ? null : cloneDeep(this[SYM_PARENT]);
    }

    set parent(value) {
        if (value instanceof Dependency) {
            this[SYM_PARENT] = { name: value.name, version: value.version };
        }
        else {
            this[SYM_PARENT] = null;
        }
    }

    /**
     * @memberof Dependency#
     * @member {Object} flags
     */
    get flags() {
        return cloneDeep(this[SYM_FLAGS]);
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasManifest
     */
    get hasManifest() {
        return this[SYM_FLAGS].hasManifest;
    }

    set hasManifest(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasManifest = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} isDeprecated
     */
    get isDeprecated() {
        return this[SYM_FLAGS].isDeprecated;
    }

    set isDeprecated(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].isDeprecated = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasSuspectImport
     */
    get hasSuspectImport() {
        return this[SYM_FLAGS].hasSuspectImport;
    }

    set hasSuspectImport(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasSuspectImport = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasLicense
     */
    get hasLicense() {
        return this[SYM_FLAGS].hasLicense;
    }

    set hasLicense(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasLicense = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasIndirectDependencies
     */
    get hasIndirectDependencies() {
        return this[SYM_FLAGS].hasIndirectDependencies;
    }

    set hasIndirectDependencies(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasIndirectDependencies = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasMinifiedCode
     */
    get hasMinifiedCode() {
        return this[SYM_FLAGS].hasMinifiedCode;
    }

    set hasMinifiedCode(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasMinifiedCode = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasCustomResolver
     */
    get hasCustomResolver() {
        return this[SYM_FLAGS].hasCustomResolver;
    }

    set hasCustomResolver(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasCustomResolver = value;
    }

    /**
     * @memberof Dependency#
     * @member {Boolean} hasDependencies
     */
    get hasDependencies() {
        return this[SYM_FLAGS].hasDependencies;
    }

    set hasDependencies(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("value must be typeof boolean");
        }
        this[SYM_FLAGS].hasDependencies = value;
    }
}

Dependency.currentId = 1;

module.exports = Dependency;
