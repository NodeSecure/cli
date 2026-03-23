# PayloadManifestCache

An internal class that manages the on-disk manifest (`manifest.json`) and per-spec metadata files. It is exported for advanced use cases such as testing or custom persistence strategies.

## Constructor

### `constructor(options?: PayloadCacheOptions)`

**Parameters**:

- `options` (`PayloadCacheOptions`, optional): Same options as `PayloadCache`.

## Properties

### `currentSpec`

```ts
currentSpec: string | null
```

The currently active spec. Updated by `PayloadCache.setCurrentSpec`.

## Methods

### `initialize(): Promise<this>`

Creates the `PayloadCache.PATH` directory if it does not exist.

**Returns**: `Promise<this>`

### `load(): Promise<PayloadStorageMap>`

Reads `manifest.json` and loads each spec's metadata from its individual storage file. Returns an empty map if no manifest is found.

**Returns**: `Promise<PayloadStorageMap>`

### `persistPartial(storage: PayloadStorageMap): Promise<this>`

Writes only the dirty (changed) metadata entries to their individual storage files, then rewrites `manifest.json` with the current list of specs and `currentSpec`.

**Returns**: `Promise<this>`

### `lazyPersistOnDisk(storage: PayloadStorageMap, options?: { dirtySpecs?: string[] }): void`

Schedules a `persistPartial` call via `queueMicrotask`, batching multiple synchronous writes into a single disk operation.

**Parameters**:

- `storage` (`PayloadStorageMap`): The current in-memory storage map.
- `options.dirtySpecs` (`string[]`, optional): Specs whose metadata needs to be rewritten.
