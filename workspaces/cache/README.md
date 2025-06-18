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
import { appCache } from "@nodesecure/cache"

await appCache.initPayloadsList();
await appCache.setRootPayload(payload);
```

## API

### `updateConfig(config)`

Stores a new configuration object in the cache.

### `getConfig()`

Retrieves the current configuration object from the cache.

### `updatePayload(pkg, payload)`

Saves an analysis payload for a given package.

**Parameters**:
- `pkg` (`string`): Package name (e.g., `"@nodesecure/scanner@6.0.0"`).
- `payload` (`object`): The analysis result to store.

> [!NOTE]
> Payloads are stored in the user's home directory under `~/.nsecure/payloads/`

### `getPayload(pkg)`

Loads an analysis payload for a given package.

**Parameters**:
`pkg` (`string`): Package name.

### `availablePayloads()`

Lists all available payloads (package names) in the cache.

### `getPayloadOrNull(pkg)`

Loads an analysis payload for a given package, or returns `null` if not found.

**Parameters**:

- `pkg` (`string`): Package name.

Returns `null` if not found.

### `updatePayloadsList(payloadsList)`

Updates the internal MRU/LRU and available payloads list.

**Parameters**:

- `payloadsList` (`object`): The new payloads list object.

### `payloadsList()`

Retrieves the current MRU/LRU and available payloads list.

### `initPayloadsList(options = {})`

Initializes the payloads list, optionally resetting the cache.

**Parameters**:

- `options` (`object`, *optional*):
  - `logging` (`boolean`, default: `true`): Enable logging.
  - `reset` (`boolean`, default: `false`): If `true`, reset the cache before initializing.

### `removePayload(pkg)`

Removes a payload for a given package from the cache.

**Parameters**:
- `pkg` (`string`): Package name.

### `removeLastMRU()`

Removes the least recently used payload if the MRU exceeds the maximum allowed.

### `setRootPayload(payload, options)`

Sets a new root payload, updates MRU/LRU, and manages cache state.

**Parameters**:

- `payload` (`object`): The analysis result to set as root.
- `options` (`object`):
  - `logging` (`boolean`, default: `true`): Enable logging.
  - `local` (`boolean`, default: `false`): Mark the payload as local.
