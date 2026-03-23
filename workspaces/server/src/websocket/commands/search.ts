// Import Third-party Dependencies
import * as scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import { context } from "../websocket.als.ts";
import type {
  WebSocketResponse
} from "../websocket.types.ts";

export async function* search(
  spec: string
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const foundInCache = yield* searchInCache(spec);
  if (foundInCache) {
    return;
  }

  const { logger } = context.getStore()!;
  logger.info("[ws|command.search] scan starting");
  yield {
    status: "SCAN" as const,
    spec
  };

  const payload = await scanner.from(
    spec,
    { maxDepth: 4 }
  );
  logger.info("[ws|command.search] scan completed");

  yield* saveInCache(payload);
}

async function* searchInCache(
  spec: string
): AsyncGenerator<WebSocketResponse, boolean, unknown> {
  const { logger, cache } = context.getStore()!;

  const payload = await cache.findBySpec(spec);
  if (!payload) {
    return false;
  }
  logger.info("[ws|command.search] payload found in cache");
  cache.setCurrentSpec(spec);

  yield {
    status: "PAYLOAD" as const,
    payload
  };
  yield {
    status: "RELOAD" as const,
    cache: Array.from(cache)
  };

  return true;
}

async function* saveInCache(
  payload: scanner.Payload
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { logger, cache } = context.getStore()!;

  await cache.save(payload, {
    useAsCurrent: true,
    scanType: "from"
  });
  logger.info("[ws|command.search] cache updated");

  yield {
    status: "PAYLOAD" as const,
    payload
  };
  yield {
    status: "RELOAD" as const,
    cache: Array.from(cache)
  };
}
