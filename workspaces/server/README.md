# `server`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fserver%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/server)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/LICENSE)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/server?style=for-the-badge)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/server.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%22server+CI%22)

NodeSecure CLI's http server based on `polka`.

## Requirements

- [Node.js](https://nodejs.org/en/) v20 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/server
# or
$ yarn add @nodesecure/server
```

## Usage example

```js
import { buildServer } from "@nodesecure/server";

const kProjectRootDir = path.join(import.meta.dirname, "..", "..");
const kComponentsDir = path.join(kProjectRootDir, "public", "components");
const kDataFilePath = path.join(
  process.cwd(),
  "nsecure-result.json"
);

const httpServer = buildServer(kDataFilePath, {
  port: 3000,
  projectRootDir: kProjectRootDir,
  componentsDir: kComponentsDir
});

httpServer.listen(port, async() => {
  console.log(`Server listening on port ${port}`);
});
```

## API

### `buildServer(dataFilePath: string, options: BuildServerOptions): polka`

Creates and configures a Polka HTTP server instance for the NodeSecure platform.

**Parameters**
- `dataFilePath` (`string`):
Path to the data file used by the server. Required if `runFromPayload` is `true`.

- `options` (`object`):
Configuration options for the server.
  - `hotReload` (`boolean`, default: `true`):
Enable or disable hot reloading of server data.
  - `runFromPayload` (`boolean`, default: `true`):
If true, the server will use the provided dataFilePath for reading and writing data. If false, the server will start with an empty cache.
  - `projectRootDir` (`string`):
The root directory of the project, used for serving static files and resolving paths.
  - `componentsDir` (`string`):
Directory containing UI components.
  - `i18n` (`object`)
    - `english`: `NestedStringRecord`
    - `french`: `NestedStringRecord`
The i18n tokens required for the interface.

**Returns**
- `httpServer` (`object`):
A configured **Polka** server instance with all routes and middlewares registered.

## API Endpoints
The server exposes the following REST API endpoints:

- `GET /`
Render and return the main HTML page for the NodeSecure UI.

- `GET /data`
Returns the current analysis payload from the cache.

- **204**: No content if running from an empty cache.
- **200**: JSON payload with analysis data.

- `GET /config`
Fetch the current server configuration.

- `PUT /config`
Update and save the server configuration.

**Body**: JSON configuration object.

- `GET /i18n`
Returns UI translations for supported languages (English and French).

- `GET /search/:packageName`
Search for npm packages by name.

**Params**:
- `packageName`: The name (or partial name) of the npm package to search for.

**Response**:
- `count`: Number of results.
- `result`: Array of package objects (name, version, description).

- `GET /search-versions/:packageName`
Get all available versions for a given npm package.

**Params**:
- `packageName`: The npm package name.

**Response**:
Array of version strings.

- `GET /flags`
List all available NodeSecure flags and their metadata.

- `GET /flags/description/:title`
Get the HTML description for a specific flag.

**Params**:
- `title`: The flag name.

- `GET /bundle/:pkgName`
Get bundle size information for a package from Bundlephobia.

**Params**:
- `pkgName`: The npm package name.

- `GET /bundle/:pkgName/:version`
Get bundle size information for a specific version of a package from Bundlephobia.

**Params**:
- `pkgName`: The npm package name.
- `version`: The package version.

- `GET /downloads/:pkgName`
Get npm download statistics for the last week for a package.

**Params**:
- `pkgName`: The npm package name.

- `GET /scorecard/:org/:pkgName`
Get OSSF Scorecard results for a package repository.

**Params**:
- `org`: The organization or user.
- `pkgName`: The repository name.

**Query**:
`platform` (*optional*): The platform (default: `github.com`).

- `POST /report`
Generate a PDF report for the current analysis.

**Body**:
- `title`: Report title.
- `includesAllDeps`: Boolean, include all dependencies or only the root.
- `theme`: Report theme.

**Response**:
PDF file as binary data.

### Static Files

All static files (UI, assets, etc.) are served from the project root directory.

> [!NOTE]
> For more details on each endpoint, see the corresponding files in /src/endpoints.

## Websocket actions

The `WebSocketServerInstanciator` class sets up and manages a WebSocket server for real-time communication with NodeSecure clients. It provides live updates and cache management features for package analysis.

```js
new WebSocketServerInstanciator();
```
- Initializes a WebSocket server on port 1338.
- Listens for client connections and incoming messages.

- `SEARCH`:

**Request**:
```json
{
  "action": "SEARCH",
  "pkg": "<package-name>"
}
```

**Response**:

Streams scan progress, payload data, and cache state updates.

- `REMOVE`:

**Request**:
```json
{
  "action": "REMOVE",
  "pkg": "<package-name>"
}
```

**Response**:

Streams cache state updates after removal.

## Interfaces

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
