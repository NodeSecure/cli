// Import Internal Dependencies
import { context } from "../websocket.als.ts";
import type {
  WebSocketResponse
} from "../websocket.types.ts";

export async function* remove(
  spec: string
): AsyncGenerator<WebSocketResponse, void, unknown> {
  const { cache } = context.getStore()!;

  await cache.remove(spec);

  yield {
    status: "RELOAD",
    cache: Array.from(cache)
  };
}
