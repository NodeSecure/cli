// Import Third-party Dependencies
import type { WebSocket } from "ws";
import type { AppCache, PayloadsList } from "@nodesecure/cache";
import type { Payload } from "@nodesecure/scanner";

// Import Internal Dependencies
import type { logger } from "../logger.ts";

type PayloadResponse = {
  status: "PAYLOAD";
  payload: Payload;
};

/**
 * A (NodeSecure) scan is in progress
 */
type ScanResponse = {
  status: "SCAN";
  spec: string;
};

/**
 * Initialize or Reload the list of packages available in cache
 */
type CachedResponse = {
  status: "INIT" | "RELOAD";
  cache: PayloadsList;
};

export type WebSocketResponse =
  | PayloadResponse
  | CachedResponse
  | ScanResponse;

export type WebSocketMessage = {
  commandName: "SEARCH" | "REMOVE";
  spec: string;
};

export interface WebSocketContext {
  socket: WebSocket;
  cache: AppCache;
  logger: typeof logger;
}
