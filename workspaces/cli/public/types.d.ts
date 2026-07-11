// Shared structural types reused across multiple components.
// Component-local, single-use shapes should stay as local `@typedef` blocks
// in their own file instead of being added here.

/**
 * Application settings, hydrated from the `/config` endpoint and mutated in place
 * whenever the user updates a preference (see `SettingsView#setNewConfig`).
 */
export interface AppConfig {
  ignore: {
    warnings: Set<string>;
    flags: Set<string>;
  };
  theme: string;
  defaultPackageMenu: string;
  showFriendlyDependencies: boolean;
  disableExternalRequests: boolean;
}

/**
 * A cached package specification, as returned by the WebSocket `INIT` / `RELOAD` events.
 */
export interface CachedSpec {
  spec: string;
  scanType?: string;
}

export {};
