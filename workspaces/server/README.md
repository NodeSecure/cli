# `server`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fserver%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/server)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/server.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%22server+CI%22)

NodeSecure CLI's HTTP and WebSocket server. Serves the analysis UI, exposes a REST API for data and configuration, and provides real-time package scanning via WebSocket.

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) v22 or higher

## 💃 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/server
# or
$ yarn add @nodesecure/server
```

## 👀 Usage example

```js
import path from "node:path";
import {
  buildServer,
  WebSocketServerInstanciator,
  logger
} from "@nodesecure/server";

const kDataFilePath = path.join(process.cwd(), "nsecure-result.json");

const { httpServer, cache } = await buildServer(kDataFilePath, {
  projectRootDir: path.join(import.meta.dirname, "..", ".."),
  componentsDir: path.join(kProjectRootDir, "public", "components")
});

const ws = new WebSocketServerInstanciator({ cache, logger });

httpServer.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

## 📚 API

### `buildServer(dataFilePath, options)`

```ts
buildServer(dataFilePath: string, options: BuildServerOptions): Promise<{
  httpServer: http.Server;
  cache: PayloadCache;
}>
```

Creates and configures the HTTP server and cache for the NodeSecure CLI UI.

```ts
type NestedStringRecord = {
  [key: string]: string | NestedStringRecord;
};

interface BuildServerOptions {
  hotReload?: boolean;
  runFromPayload?: boolean;
  projectRootDir: string;
  componentsDir: string;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
}
```

### `WebSocketServerInstanciator`

```ts
new WebSocketServerInstanciator({ cache, logger })
```

Starts a WebSocket server on port **1338** for real-time package scanning and cache management. See [docs/websocket.md](./docs/websocket.md) for the full protocol.

### Documentation

- [REST API Endpoints](./docs/endpoints.md)
- [WebSocket API](./docs/websocket.md)
