// Import Node.js Dependencies
import stream from "node:stream";

// Import Third-party Dependencies
import send from "@polka/send-type";
import { getManifest, lazyFetchFlagFile, getFlags } from "@nodesecure/flags";

// CONSTANTS
const kNodeSecureFlags = getFlags();

export function getAll(_req, res) {
  send(res, 200, getManifest());
}

export function get(req, res) {
  if (req.params.title !== "hasDuplicate" && !kNodeSecureFlags.has(req.params.title)) {
    return send(res, 404, { error: "Not Found" });
  }

  res.writeHead(200, { "Content-Type": "text/html" });

  return stream.pipeline(lazyFetchFlagFile(req.params.title), res, (err) => {
    if (err) {
      console.error(err);
    }
  });
}
