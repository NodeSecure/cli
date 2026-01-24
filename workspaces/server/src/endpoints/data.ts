// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Internal Dependencies
import { context } from "../ALS.ts";
import { logger } from "../logger.ts";
import { send } from "./util/send.ts";

export async function get(
  _req: IncomingMessage,
  res: ServerResponse
) {
  const { cache } = context.getStore()!;

  const currentSpec = cache.getCurrentSpec();
  if (currentSpec === null) {
    logger.info("[data|get](no content)");
    res.statusCode = 204;
    res.end();
  }
  else {
    logger.info("[data|get](fetching data for spec=%s)", currentSpec);

    const payload = await cache.findBySpec(currentSpec);
    if (payload === null) {
      logger.info("[data|get](spec=%s not found)", currentSpec);
      res.statusCode = 404;
      res.end();

      return;
    }

    send(
      res,
      payload
    );
  }
}
