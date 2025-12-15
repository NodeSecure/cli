# FilePersistanceProvider

A generic file-based cache provider using [cacache](https://www.npmjs.com/package/cacache) for persistent storage.

## Usage Example

```ts
import { FilePersistanceProvider } from "@nodesecure/cache";

interface MyData {
  name: string;
  value: number;
}

const cache = new FilePersistanceProvider<MyData>("my-cache-key");

// Store data
await cache.set({ name: "example", value: 42 });

// Retrieve data
const data = await cache.get();
console.log(data); // { name: "example", value: 42 }

// Remove data
await cache.remove();
```

## Interfaces

```ts
interface BasePersistanceProvider<T> {
  get(): Promise<T | null>;
  set(value: T): Promise<boolean>;
  remove(): Promise<void>;
}
```

## API

### `static PATH`

The base path for the cache storage.

**Default**: `os.tmpdir()/nsecure-cli`

### `constructor(cacheKey: string)`

Creates a new instance of the persistence provider.

**Parameters**:

- `cacheKey` (`string`): A unique key to identify the cached data.

### `get(): Promise<T | null>`

Retrieves a cached value by its key.

**Returns**: 

- `Promise<T | null>`: The cached value parsed from JSON, or `null` if not found or on error.

### `set(value: T): Promise<boolean>`

Stores a value in the cache.

**Parameters**:

- `value` (`T`): The value to cache (will be JSON stringified).

**Returns**: 

- `Promise<boolean>`: `true` if the value was successfully stored, `false` on error.

### `remove(): Promise<void>`

Removes the cached entry associated with the key.

