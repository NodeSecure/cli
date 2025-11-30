// Import Node.js Dependencies
import type { IncomingMessage } from "node:http";
import consumers from "node:stream/consumers";

export function bodyParser<T = unknown>(
  req: IncomingMessage
): Promise<T> {
  switch (req.headers["content-type"]) {
    case "application/json":
      return consumers.json(req) as Promise<T>;
    default:
      return consumers.text(req) as Promise<T>;
  }
}
