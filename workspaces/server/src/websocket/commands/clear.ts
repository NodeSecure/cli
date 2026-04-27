// Import Internal Dependencies
import { context } from "../websocket.als.ts";
import type { WebSocketResponse } from "../websocket.types.ts";

export async function* clear(): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { cache } = context.getStore()!;

  await cache.clear();
  await cache.load();

  yield {
    status: "RELOAD",
    cache: []
  };
}
