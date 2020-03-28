/// <reference types="js-x-ray"/>
/// <reference types="ntlp"/>

import { Warning, Dependencies } from "js-x-ray";
import { license as License } from "ntlp";

declare namespace NodeSecure {
    interface Publisher {
        name: string;
        version: string;
        at: string;
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
        parent?: {
            name: string;
            version: string;
        };
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

    interface VerifyPayload {
        files: {
            list: string[];
            extensions: string[];
            minified: string[];
        };
        directorySize: number;
        uniqueLicenseIds: string[];
        licenses: License[];
        ast: {
            dependencies: {
                [fileName: string]: Dependencies;
            };
            warnings: Warning[];
        };
    }

    interface Options {
        readonly verbose?: boolean;
        readonly maxDepth?: number;
    }

    export function cwd(path: string, options?: NodeSecure.Options): Promise<NodeSecure.Payload>;
    export function from(packageName: string, options?: NodeSecure.Options): Promise<NodeSecure.Payload>;
    export function verify(packageName: string): Promise<NodeSecure.VerifyPayload>;
}

export = NodeSecure;
export as namespace NodeSecure;
