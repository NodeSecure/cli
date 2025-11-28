# `cache`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%cache%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/cache)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/LICENSE)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/cache?style=for-the-badge)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/cache.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%cache+CI%22)

Caching layer for NodeSecure CLI and server, handling configuration, analysis payloads, and cache state management.

## Requirements

- [Node.js](https://nodejs.org/en/) v20 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/cache
# or
$ yarn add @nodesecure/cache
```

## Features

- Stores and retrieves configuration and analysis payloads.
- Manages a Most Recently Used (MRU) and Least Recently Used (LRU) list for payloads.
- Supports cache initialization, reset, and removal of old payloads.
- Handles payloads for multiple packages, including local and remote analysis results.

## Usage example

```js
import { AppCache } from "@nodesecure/cache";

const cache = new AppCache();

await cache.initPayloadsList();
await cache.setRootPayload(payload);
```

## API

### `updateConfig(config: AppConfig): Promise<void>`

Stores a new configuration object in the cache.

### `getConfig(): Promise<AppConfig>`

Retrieves the current configuration object from the cache.

### `updatePayload(packageName: string, payload: Payload): void`

Saves an analysis payload for a given package.

**Parameters**:
- `pkg` (`string`): Package name (e.g., `"@nodesecure/scanner@6.0.0"`).
- `payload` (`object`): The analysis result to store.

> [!NOTE]
> Payloads are stored in the user's home directory under `~/.nsecure/payloads/`

### `getPayload(packageName: string): Payload`

Loads an analysis payload for a given package.

**Parameters**:
`pkg` (`string`): Package name.

### `availablePayloads(): string[]`

Lists all available payloads (package names) in the cache.

### `getPayloadOrNull(packageName: string): Payload | null`

Loads an analysis payload for a given package, or returns `null` if not found.

**Parameters**:

- `pkg` (`string`): Package name.

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
- `pkg` (`string`): Package name.

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
interface AppConfig {
  defaultPackageMenu: string;
  ignore: {
    flags: Flag[];
    warnings: WarningName[];
  };
  theme?: "light" | "dark";
  disableExternalRequests: boolean;
}

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
