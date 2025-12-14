// Import Third-party Dependencies
import { WebSocketServer, type WebSocket } from "ws";
import { match } from "ts-pattern";
import type { Logger } from "pino";
import type { AppCache } from "@nodesecure/cache/dist/AppCache.ts";

// Import Internal Dependencies
import { search } from "./commands/search.ts";
import { remove } from "./commands/remove.ts";
import { context } from "./websocket.als.ts";
import type {
  WebSocketResponse,
  WebSocketContext,
  WebSocketMessage
} from "./websocket.types.ts";

export interface WebSocketServerInstanciatorOptions {
  logger: Logger<never, boolean>;
  cache: AppCache;
}

export class WebSocketServerInstanciator {
  #logger: Logger<never, boolean>;
  #cache: AppCache;

  constructor(
    options: WebSocketServerInstanciatorOptions
  ) {
    this.#logger = options.logger;
    this.#cache = options.cache;
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
      cache: this.#cache,
      logger: this.#logger
    };

    const commandName = message.commandName;
    this.#logger.info(`[ws|command.${commandName.toLowerCase()}] ${message.spec}`);

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

        this.#logger.error(`[ws|command.${commandName}](error: ${errorMessage})`);
        this.#logger.debug(error);
      }
    });
  }

  async initializeServer(
    stopInitializationOnError = false
  ): Promise<WebSocketResponse | null> {
    try {
      const cached = await this.#cache.payloadsList();
      if (
        cached.mru === void 0 ||
        cached.current === void 0
      ) {
        throw new Error("Payloads list not found in cache.");
      }
      this.#logger.info(
        `[ws|init](current: ${cached.current}|root: ${cached.root})`
      );

      return {
        status: "INIT",
        cache: cached
      };
    }
    catch {
      if (stopInitializationOnError) {
        return null;
      }

      this.#logger.error("[ws|init] creating new payloads list in cache");
      await this.#cache.initPayloadsList();

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
