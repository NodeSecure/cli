# `cache`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fcache%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/cache)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/LICENSE)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/cache?style=for-the-badge)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/cache.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%cache+CI%22)

Caching layer for NodeSecure CLI and server, handling configuration, analysis payloads, and cache state management.

## Requirements

- [Node.js](https://nodejs.org/en/) v24 or higher

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

- [AppCache](./docs/AppCache.md)
- [FilePersistanceProvider](./docs/FilePersistanceProvider.md)
