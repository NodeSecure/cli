// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import type { AppConfig } from "@nodesecure/cache";

// Import Internal Dependencies
import * as config from "../config.ts";
import { bodyParser } from "./util/bodyParser.ts";
import { send } from "./util/send.ts";

export async function get(
  _req: IncomingMessage,
  res: ServerResponse
) {
  const result = await config.get();

  send(res, result);
}

export async function save(
  req: IncomingMessage,
  res: ServerResponse
) {
  const data = await bodyParser<AppConfig>(req);
  await config.set(data);

  res.statusCode = 204;
  res.end();
}
