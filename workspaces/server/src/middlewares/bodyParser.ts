// Import Third-party Dependencies
import type { Request } from "express-serve-static-core";

/**
 * @async
 * @function bodyParser
 * @param {*} req
 * @returns {Promise<any>}
 */
export async function bodyParser(req: Request) {
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
