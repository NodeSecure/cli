declare namespace NodeSecure {
    interface ParentNode {
        name: string;
        version: string;
    }

    interface Flags {
        hasManifest: boolean;
        isDeprecated: boolean;
        hasSuspectImport: boolean;
        hasLicense: boolean;
        hasMinifiedCode: boolean;
        hasIndirectDependencies: boolean;
        hasCustomResolver: boolean;
        hasDependencies: boolean;
    }

    interface Dependency {
        name: string;
        version: string;
        parent: ParentNode | null;
        flags: Flags;
    }

    interface Payload {
        [version: string]: {
            userBy: {
                [packageName: string]: string;
            };
            size: number;
            description: string;
            author: any;
            composition: {
                extensions: string[];
                files: string[];
                minified: string[];
                required: string[];
                required_builtin: string[];
                suspectFiles?: string[];
            };
            license?: {
                name: string;
                url?: string;
            };
            flags: Flags;
        }
    }
}

declare function NodeSecure(cwd?: string): Promise<NodeSecure.Payload>;

export = NodeSecure;
export as namespace NodeSecure;
