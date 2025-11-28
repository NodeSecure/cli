// Import Node.js Dependencies
import type { IncomingMessage } from "node:http";

/**
 * @async
 * @function bodyParser
 * @param {*} req
 * @returns {Promise<any>}
 */
export async function bodyParser(
  req: IncomingMessage
) {
  let rawBody = "";
  for await (const chunk of req) {
    rawBody += chunk;
  }

  switch (req.headers["content-type"]) {
    case "application/json":
      return JSON.parse(rawBody);
    default:
      return rawBody;
  }
}
