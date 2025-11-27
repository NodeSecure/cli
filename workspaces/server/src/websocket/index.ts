// Import Third-party Dependencies
import { WebSocketServer, type WebSocket } from "ws";
import { match } from "ts-pattern";
import { appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import { logger } from "../logger.js";
import { search } from "./commands/search.js";
import { remove } from "./commands/remove.js";
import { context } from "./websocket.als.js";
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
      this.#onMessageHandler(socket, JSON.parse(rawData));
    });

    const data = await this.initializeServer();
    sendSocketResponse(socket, data);
  }

  async #onMessageHandler(
    socket: WebSocket,
    message: WebSocketMessage
  ) {
    const ctx: WebSocketContext = {
      socket,
      cache: appCache,
      logger
    };

    const commandName = message.commandName;
    logger.info(`[ws|command.${commandName.toLowerCase()}] ${message.spec}`);

    context.run(ctx, async() => {
      try {
        const socketMessages = match(message)
          .with({ commandName: "SEARCH" }, (command) => search(command.spec))
          .with({ commandName: "REMOVE" }, (command) => remove(command.spec))
          .exhaustive();

        for await (const message of socketMessages) {
          sendSocketResponse(socket, message);
        }
      }
      catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        logger.error(`[ws|command.${commandName}](error: ${errorMessage})`);
        logger.debug(error);
      }
    });
  }

  async initializeServer(
    stopInitializationOnError = false
  ): Promise<WebSocketResponse | null> {
    try {
      const cache = await appCache.payloadsList();
      if (
        cache.mru === void 0 ||
        cache.current === void 0
      ) {
        throw new Error("Payloads list not found in cache.");
      }
      logger.info(
        `[ws|init](current: ${cache.current}|root: ${cache.root})`
      );

      return {
        status: "INIT",
        cache
      };
    }
    catch {
      if (stopInitializationOnError) {
        return null;
      }

      logger.error("[ws|init] creating new payloads list in cache");
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
