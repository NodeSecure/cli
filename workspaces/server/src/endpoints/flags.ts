// Import Node.js Dependencies
import stream from "node:stream";
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import {
  getManifest,
  lazyFetchFlagFile,
  getFlags
} from "@nodesecure/flags";

// Import Internal Dependencies
import { send } from "./util/send.ts";

// CONSTANTS
const kNodeSecureFlags = getFlags();

export function getAll(
  _req: IncomingMessage,
  res: ServerResponse
) {
  send(res, getManifest());
}

export function get(
  _: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string | undefined>
) {
  const { title } = params;
  if (!title) {
    return send(
      res,
      { error: "Title is missing." },
      { code: 400 }
    );
  }

  if (
    title !== "hasDuplicate" &&
    !kNodeSecureFlags.has(title)
  ) {
    return send(
      res,
      { error: "Not Found" },
      { code: 404 }
    );
  }

  res.writeHead(200, { "Content-Type": "text/html" });

  return stream.pipeline(lazyFetchFlagFile(title), res, (err) => {
    if (err) {
      console.error(err);
    }
  });
}
