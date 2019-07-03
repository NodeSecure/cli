declare namespace NodeSecure {
    interface Dependency {
        name: string;
        version: string;
        parent: {
            name: string;
            version: string;
        } | null;
        flags: {
            hasIndirectDependencies: boolean;
            hasCustomResolver: boolean;
            hasDependencies: boolean;
        }
    }
}

export = NodeSecure;
export as namespace NodeSecure;
