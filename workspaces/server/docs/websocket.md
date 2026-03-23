# WebSocket API

The `WebSocketServerInstanciator` class manages a WebSocket server for real-time communication between the NodeSecure server and its clients.

## Connection

The WebSocket server listens on **port 1338**.

```js
const ws = new WebSocket("ws://localhost:1338");
```

Upon connection, the server immediately sends an `INIT` message containing the list of packages currently available in cache (see [Response Types](#response-types)).

---

## Sending Commands

All client messages must be JSON-serialized objects matching the following shape:

```ts
type WebSocketMessage = {
  commandName: "SEARCH" | "REMOVE";
  spec: string; // "<package-name>@<version>"
};
```

Example:
```json
{
  "commandName": "SEARCH",
  "spec": "express@4.18.2"
}
```

---

## Response Types

The server sends JSON-serialized responses. A response always has a `status` field that discriminates its type.

### `INIT`

Sent automatically on connection. Contains the current list of cached packages.

```ts
{
  status: "INIT";
  cache: PayloadMetadata[];
}
```

### `RELOAD`

Sent after a `SEARCH` or `REMOVE` command completes. Contains the updated cache list.

```ts
{
  status: "RELOAD";
  cache: PayloadMetadata[];
}
```

### `PAYLOAD`

Sent after a package is found (either in cache or after a fresh scan). Contains the full analysis payload.

```ts
{
  status: "PAYLOAD";
  payload: Payload; // @nodesecure/scanner Payload
}
```

### `SCAN`

Sent when an error happen when running a command

```ts
{
  status: "ERROR";
  error: string;
}
```

### `ERROR`

Sent when a package is **not** in cache and a fresh scan has started. Lets the client display a loading/progress state.

```ts
{
  status: "SCAN";
  spec: string; // the spec being scanned
}
```

---

## Commands

### `SEARCH`

Searches for a package. If the package is already in cache the result is served immediately. Otherwise a live scan is triggered via `@nodesecure/scanner` (max depth: 4).

**Request:**
```json
{
  "commandName": "SEARCH",
  "spec": "express@4.18.2"
}
```

**Response sequence (cache hit):**
1. `PAYLOAD` — analysis data
2. `RELOAD` — updated cache list

**Response sequence (cache miss / fresh scan):**
1. `SCAN` — scan started
2. `PAYLOAD` — analysis data (after scan completes)
3. `RELOAD` — updated cache list

---

### `REMOVE`

Removes a package from the cache.

**Request:**
```json
{
  "commandName": "REMOVE",
  "spec": "express@4.18.2"
}
```

**Response sequence:**
1. `RELOAD` — updated cache list after removal
