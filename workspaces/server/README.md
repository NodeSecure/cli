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

const { httpServer, cache, viewBuilder } = await buildServer(kDataFilePath, {
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
buildServer(dataFilePath: string | undefined, options: BuildServerOptions): Promise<{
  httpServer: http.Server;
  cache: PayloadCache;
  viewBuilder: ViewBuilder;
}>
```

Creates and configures the HTTP server, cache, and view builder for the NodeSecure CLI UI. When `dataFilePath` is `undefined`, the server starts with an empty cache (equivalent to setting `runFromPayload: false`).

```ts
type NestedStringRecord = {
  [key: string]: string | NestedStringRecord;
};

interface BuildServerOptions {
  hotReload?: boolean;
  runFromPayload?: boolean;
  scanType?: "cwd" | "from";
  projectRootDir: string;
  componentsDir: string;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
  /**
   * Optional connect-style middleware executed before static file serving and
   * the API router. Call `next()` to continue to the normal request pipeline,
   * or handle the request directly without calling `next()` to short-circuit it.
   */
  middleware?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => void
  ) => void;
}
```

The `middleware` option is useful when an additional layer needs to intercept specific requests before they reach the static file server or the API router. For example, the dev build uses it to proxy `/esbuild` SSE requests to the esbuild serve process:

```js
const { httpServer, cache } = await buildServer(dataFilePath, {
  // ...
  middleware: (req, res, next) => {
    if (req.url === "/esbuild") {
      // proxy to esbuild dev server
      return;
    }
    next();
  }
});
```

### `WebSocketServerInstanciator`

```ts
new WebSocketServerInstanciator({ cache, logger })
```

Starts a WebSocket server on port **1338** for real-time package scanning and cache management. See [docs/websocket.md](./docs/websocket.md) for the full protocol.

### Documentation

- [REST API Endpoints](./docs/endpoints.md)
- [WebSocket API](./docs/websocket.md)
