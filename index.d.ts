declare namespace NodeSecure {
    interface ParentNode {
        name: string;
        version: string;
    }

    interface Publisher {
        name: string;
        version: string;
        firstPublishAt: string;
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

    interface Owner {
        name: string;
        at: string;
        version: string;
    }

    interface Author {
        name?: string;
        url?: string;
        email?: string;
    }

    interface Flags {
        isGit: boolean;
        hasManifest: boolean;
        isDeprecated: boolean;
        hasSuspectImport: boolean;
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

    interface VersionDescriptor {
        metadata: {
            publishedCount: number;
            lastUpdateAt: number;
            lastVersion: number;
            hasChangedAuthor: boolean;
            hasManyPublishers: boolean;
            author: 'N/A' | string;
            authors: Owner[];
            publishers: Publisher[];
        };
        versions: string[];
        vulnerabilities: any[];
        [version: string]: {
            id: number;
            usedBy: {
                [packageName: string]: string;
            };
            size: number;
            description: string;
            author: string | Author;
            composition: {
                extensions: string[];
                files: string[];
                minified: string[];
                required: string[];
                required_builtin: string[];
                unused: string[];
                missing: string[];
                suspectFiles?: string[];
            };
            license: string | License[];
            flags: Flags;
            gitUrl: null | string;
        };
    }

    interface Payload {
        [packageName: string]: VersionDescriptor;
    }

    interface Options {
        verbose?: boolean;
        maxDepth?: number;
    }

    declare function cwd(path: string, options?: NodeSecure.Options): Promise<NodeSecure.Payload>;
    declare function from(packageName: string, options?: NodeSecure.Options): Promise<NodeSecure.Payload>;
}

export = NodeSecure;
export as namespace NodeSecure;
