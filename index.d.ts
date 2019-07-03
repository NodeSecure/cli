declare namespace NodeSecure {
    interface ParentNode {
        name: string;
        version: string;
    }

    interface Flags {
        hasManifest: boolean;
        isDeprecated: boolean;
        hasLicense: boolean;
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
            };
            license?: {
                name: string;
                url?: string;
            };
            flags: Flags;
        }
    }
}

export = NodeSecure;
export as namespace NodeSecure;
