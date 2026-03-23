# `cache`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fcache%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/cache)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/cache.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%cache+CI%22)

Disk-based caching layer for NodeSecure analysis payloads, with manifest tracking, MRU ordering, and integrity verification.

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) v24 or higher

## 💃 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/cache
# or
$ yarn add @nodesecure/cache
```

## 💡 Features

- 💾 Persists analysis payloads to disk with integrity tracking and a manifest of available specs.
- 🔍 Looks up cached payloads by package spec (`name@version`) or integrity hash.
- 🕐 Iterates payloads in Most Recently Used (MRU) order, tracking the currently active payload.

## 👀 Usage example

```js
import { PayloadCache } from "@nodesecure/cache";

const cache = new PayloadCache();
await cache.load();

// Save a payload (returned from @nodesecure/scanner)
await cache.save(
  payload,
  { useAsCurrent: true, scanType: "from" }
);

const found = await cache.findBySpec("express@4.18.2");

// Iterate all cached payloads in MRU order
for (const metadata of cache) {
  console.log(metadata.spec, metadata.lastUsedAt);
}

await cache.remove("express@4.18.2");

// Clear the entire cache
await cache.clear();
```

## 📚 API

- [FilePersistanceProvider](./docs/FilePersistanceProvider.md)
- [PayloadCache](./docs/PayloadCache.md)
