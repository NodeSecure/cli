# AppCache

## API

### `updatePayload(packageName: string, payload: Payload): void`

Saves an analysis payload for a given package.

**Parameters**:
- `packageName` (`string`): Package name (e.g., `"@nodesecure/scanner@6.0.0"`).
- `payload` (`object`): The analysis result to store.

> [!NOTE]
> Payloads are stored in the user's home directory under `~/.nsecure/payloads/`

### `getPayload(packageName: string): Payload`

Loads an analysis payload for a given package.

**Parameters**:
`packageName` (`string`): Package name.

### `availablePayloads(): string[]`

Lists all available payloads (package names) in the cache.

### `getPayloadOrNull(packageName: string): Payload | null`

Loads an analysis payload for a given package, or returns `null` if not found.

**Parameters**:

- `packageName` (`string`): Package name.

Returns `null` if not found.

### `updatePayloadsList(payloadsList: PayloadsList): Promise<void>`

Updates the internal MRU/LRU and available payloads list.

**Parameters**:

- `payloadsList` (`object`): The new payloads list object.

### `payloadsList(): Promise<PayloadsList>`

Retrieves the current MRU/LRU and available payloads list.

### `initPayloadsList(options: InitPayloadListOptions = {}): Promise<void>`

Initializes the payloads list, optionally resetting the cache.

**Parameters**:

- `options` (`object`, *optional*):
  - `logging` (`boolean`, default: `true`): Enable logging.
  - `reset` (`boolean`, default: `false`): If `true`, reset the cache before initializing.

### `removePayload(packageName: string): void`

Removes a payload for a given package from the cache.

**Parameters**:
- `packageName` (`string`): Package name.

### `removeLastMRU(): Promise<PayloadsList>`

Removes the least recently used payload if the MRU exceeds the maximum allowed.

### `setRootPayload(payload: Payload, options: SetRootPayloadOptions = {}): Promise<void>`

Sets a new root payload, updates MRU/LRU, and manages cache state.

**Parameters**:

- `payload` (`object`): The analysis result to set as root.
- `options` (`object`):
  - `logging` (`boolean`, default: `true`): Enable logging.
  - `local` (`boolean`, default: `false`): Mark the payload as local.

## Interfaces

```ts
interface PayloadsList {
  mru: string[];
  lru: string[];
  current: string;
  availables: string[];
  lastUsed: Record<string, number>;
  root: string | null;
}

interface LoggingOption {
  logging?: boolean;
}

interface InitPayloadListOptions extends LoggingOption {
  reset?: boolean;
}

interface SetRootPayloadOptions extends LoggingOption {
  local?: boolean;
}
```
