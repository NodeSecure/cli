# PayloadCache

Manages caching of NodeSecure analysis payloads on disk, with a manifest tracking which payloads are available and which is currently active.

## Interfaces

```ts
export type PayloadStorageMap = Map<string, PayloadMetadata>;

export interface PayloadManifest {
  current: string | null;
  specs: string[];
}

export interface PayloadMetadata {
  spec: string;
  scanType: "cwd" | "from";
  locationOnDisk: string;
  lastUsedAt: number;
  integrity: string | null;
}

export interface PayloadSaveOptions {
  /**
   * @default false
   */
  useAsCurrent?: boolean;
  /**
   * @default "cwd"
   */
  scanType?: "cwd" | "from";
}

export interface PayloadCacheOptions {
  fsProvider?: typeof fs;
  dateProvider?: DateProvider;
  storageProvider?: (spec: string) => BasePersistanceProvider<PayloadMetadata>;
}
```

## PayloadCache

### `static PATH`

The base directory where payloads are stored.

**Default**: `~/.nsecure/payloads`

### `static getPathBySpec(spec: string): string`

Returns the file path for a payload identified by its spec (`name@version`).

**Parameters**:

- `spec` (`string`): The package spec, e.g. `"express@4.18.2"`.

**Returns**: `string` — Absolute path to the payload file on disk.

### `static getPathByPayload(payload: Payload): string`

Returns the file path for a payload by deriving the spec from its root dependency.

**Parameters**:

- `payload` (`Payload`): A payload object returned by `@nodesecure/scanner`.

**Returns**: `string` — Absolute path to the payload file on disk.

### `constructor(options?: PayloadCacheOptions)`

Creates a new `PayloadCache` instance.

**Parameters**:

- `options` (`PayloadCacheOptions`, optional):
  - `fsProvider` — Override the `node:fs/promises` module (useful for testing).
  - `storageProvider` — Factory function that returns a `BasePersistanceProvider<PayloadMetadata>` for a given spec.

### `load(): Promise<this>`

Initializes the cache directory and loads all persisted payload metadata from disk. Must be called before using other instance methods.

**Returns**: `Promise<this>`

### `save(payload: Payload, options?: PayloadSaveOptions): Promise<void>`

Saves a payload to disk and registers it in the manifest. If the spec already exists in the in-memory store, only `lastUsedAt` is updated (the file is not rewritten).

**Parameters**:

- `payload` (`Payload`): The payload to cache.
- `options` (`PayloadSaveOptions`, optional):
  - `useAsCurrent` (`boolean`, default `false`): Mark this payload as the currently active one.
  - `scanType` (`"cwd" | "from"`, default `"cwd"`): How the scan was performed.

### `remove(specOrPayload: string | Payload): Promise<void>`

Removes a payload from the in-memory store, the manifest, and deletes its file from disk. If the store becomes empty, `currentSpec` is reset to `null`.

**Parameters**:

- `specOrPayload` (`string | Payload`): The spec string (e.g. `"express@4.18.2"`) or a `Payload` object.

### `findBySpec(spec: string): Promise<Payload | null>`

Reads and parses a payload file from disk by its spec.

**Parameters**:

- `spec` (`string`): The package spec, e.g. `"express@4.18.2"`.

**Returns**: `Promise<Payload | null>` — The parsed payload, or `null` if not found.

### `findByIntegrity(integrity: string): Promise<Payload | null>`

Searches the in-memory store for a payload matching the given integrity hash, then reads it from disk.

**Parameters**:

- `integrity` (`string`): The integrity hash to match against `PayloadMetadata.integrity`.

**Returns**: `Promise<Payload | null>` — The parsed payload, or `null` if not found.

### `setCurrentSpec(spec: string | null): void`

Sets the currently active spec and calls `updateLastUsedAt` if a non-null spec is provided.

**Parameters**:

- `spec` (`string | null`): The spec to mark as current, or `null` to unset.

### `getCurrentSpec(): string | null`

Returns the currently active spec.

**Returns**: `string | null`

### `updateLastUsedAt(spec: string): void`

Updates the `lastUsedAt` timestamp for the given spec in the in-memory store and schedules a lazy manifest persist.

**Parameters**:

- `spec` (`string`): The package spec to update.

### `clear(): Promise<this>`

Removes the entire payloads directory (`PayloadCache.PATH`) from disk, including all cached payload files and the manifest.

**Returns**: `Promise<this>`

### `[Symbol.iterator](): IterableIterator<PayloadMetadata>`

Iterates over all cached `PayloadMetadata` entries, sorted by `lastUsedAt` in descending order (most recently used first).

---

## Related

- [PayloadManifestCache](./PayloadManifestCache.md) — Internal class managing the on-disk manifest and per-spec metadata files.
