declare namespace NodeSecure {
    interface Dependency {
        name: string;
        version: string;
        parent: {
            name: string;
            version: string;
        } | null;
        bundlephobia?: {
            gzip: number;
            size: number;
            hasJSModule: boolean;
            hasJSNext: boolean;
            hasSideEffects: boolean;
            scoped: boolean;
        };
        flags: {
            hasIndirectDependencies: boolean;
            hasCustomResolver: boolean;
            hasDependencies: boolean;
        }
    }
}

export = NodeSecure;
export as namespace NodeSecure;
