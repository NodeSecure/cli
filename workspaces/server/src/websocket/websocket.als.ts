// Import Node.js Dependencies
import { AsyncLocalStorage } from "node:async_hooks";

// Import Internal Dependencies
import type {
  WebSocketContext
} from "./websocket.types.ts";

export const context = new AsyncLocalStorage<WebSocketContext>();
