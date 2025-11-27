// Import Third-party Dependencies
import { WebSocketServer, type WebSocket } from "ws";
import { match } from "ts-pattern";
import { appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import { logger } from "../logger.js";
import { search } from "./commands/search.js";
import { remove } from "./commands/remove.js";
import type {
  WebSocketResponse,
  WebSocketContext,
  WebSocketMessage
} from "./websocket.types.js";

export class WebSocketServerInstanciator {
  constructor() {
    const websocket = new WebSocketServer({
      port: 1338
    });
    websocket.on("connection", this.onConnectionHandler.bind(this));
  }

  async onConnectionHandler(socket: WebSocket) {
    socket.on("message", (rawData: string) => {
      logger.info(`[ws](message: ${rawData})`);

      this.onMessageHandler(socket, JSON.parse(rawData))
        .catch(console.error);
    });

    const data = await this.initializeServer();
    sendSocketResponse(socket, data);
  }

  async onMessageHandler(
    socket: WebSocket,
    message: WebSocketMessage
  ) {
    const ctx: WebSocketContext = {
      socket,
      cache: appCache,
      logger
    };

    const socketMessages = match(message.action)
      .with("SEARCH", () => search(message.pkg, ctx))
      .with("REMOVE", () => remove(message.pkg, ctx))
      .exhaustive();

    for await (const message of socketMessages) {
      sendSocketResponse(socket, message);
    }
  }

  async initializeServer(
    stopInitializationOnError = false
  ): Promise<WebSocketResponse | null> {
    try {
      const {
        current, mru, lru, availables, root, lastUsed
      } = await appCache.payloadsList();
      logger.info(`[ws|init](mru: ${mru}|lru: ${lru}|availables: ${availables}|current: ${current}|root: ${root})`);

      if (
        mru === void 0 ||
        current === void 0
      ) {
        throw new Error("Payloads list not found in cache.");
      }

      return {
        status: "INIT",
        current,
        mru,
        lru,
        availables,
        root,
        lastUsed
      };
    }
    catch {
      if (stopInitializationOnError) {
        return null;
      }

      logger.error("[ws|init](No cache yet. Creating one...)");
      await appCache.initPayloadsList();

      return this.initializeServer(true);
    }
  }
}

function sendSocketResponse(
  socket: WebSocket,
  message: WebSocketResponse | null
) {
  if (message !== null) {
    socket.send(JSON.stringify(message));
  }
}
