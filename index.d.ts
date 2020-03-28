declare namespace NodeSecure {
    interface ParentNode {
        name: string;
        version: string;
    }

    interface Publisher {
        name: string;
        version: string;
        at: string;
    }

    interface License {
        uniqueLicenseIds: string[];
        spdxLicenseLinks: string[];
        spdx: {
            osi: boolean;
            fsf: boolean;
            fsfAndOsi: boolean;
            includesDeprecated: boolean;
        };
        from: string;
    }

    interface Maintainer {
        name: string;
        email: string;
    }

    interface Author {
        name?: string;
        url?: string;
        email?: string;
    }

    interface Flags {
        isGit: boolean;
        hasManifest: boolean;
        hasOutdatedDependency: boolean;
        isDeprecated: boolean;
        hasWarnings: boolean;
        hasLicense: boolean;
        hasMultipleLicenses: boolean;
        hasMissingOrUnusedDependency: boolean;
        hasMinifiedCode: boolean;
        hasIndirectDependencies: boolean;
        hasCustomResolver: boolean;
        hasDependencies: boolean;
        hasExternalCapacity: boolean;
        hasScript: boolean;
    }

    interface Dependency {
        name: string;
        version: string;
        parent: ParentNode | null;
        flags: Flags;
    }

    interface Vulnerability {
        id: number;
        created_at: string;
        updated_at: string;
        title: string;
        author: {
            name: string;
            website: string | null;
            username: string | null;
        };
        module_name: string;
        publish_data: string;
        cves: string[];
        vulnerable_versions: string;
        patched_versions: string;
        overview: string;
        recommendation: string;
        references: string[];
        cvss_vector: string;
        cvss_score: number;
        coordinating_vendor: string;
    }

    interface Warning {
        file: string;
        kind: "unsafe-import" | "unsafe-regex" | "ast-error";
        error?: string;
        start: { line: number; column: number };
        end: { line: number; column: number };
    }

    interface VersionDescriptor {
        metadata: {
            dependencyCount: number;
            publishedCount: number;
            lastUpdateAt: number;
            lastVersion: number;
            hasChangedAuthor: boolean;
            hasManyPublishers: boolean;
            hasReceivedUpdateInOneYear: boolean;
            author: string | null;
            homepage: string | null;
            maintainers: Maintainer[];
            publishers: Publisher[];
        };
        versions: string[];
        vulnerabilities: Vulnerability[];
        [version: string]: {
            id: number;
            usedBy: {
                [packageName: string]: string;
            };
            size: number;
            description: string;
            author: string | Author;
            warnings: Warning[];
            composition: {
                extensions: string[];
                files: string[];
                minified: string[];
                required: string[];
                required_builtin: string[];
                unused: string[];
                missing: string[];
            };
            license: string | License[];
            flags: Flags;
            gitUrl: null | string;
        };
    }

    interface Payload {
        [packageName: string]: VersionDescriptor;
    }

    interface VerifyDependenciesObject {
        [depName: string]: {
            inTry: boolean;
        }
    }

    interface VerifyReport {
        files: {
            list: string[];
            extensions: string[];
            minified: string[];
        };
        directorySize: number;
        licenses: string | License[];
        ast: {
            dependencies: VerifyDependenciesObject;
            warnings: Warning[];
        };
    }

    interface Options {
        verbose?: boolean;
        maxDepth?: number;
    }

    export function cwd(path: string, options?: NodeSecure.Options): Promise<NodeSecure.Payload>;
    export function from(packageName: string, options?: NodeSecure.Options): Promise<NodeSecure.Payload>;
    export function verify(packageName: string): Promise<NodeSecure.VerifyReport>;
}

export = NodeSecure;
export as namespace NodeSecure;
