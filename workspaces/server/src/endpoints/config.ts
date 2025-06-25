// Import Third-party Dependencies
import send from "@polka/send-type";
import type { Request, Response } from "express-serve-static-core";

// Import Internal Dependencies
import * as config from "../config.js";
import { bodyParser } from "../middlewares/bodyParser.js";

export async function get(_req: Request, res: Response) {
  const result = await config.get();

  send(res, 200, result);
}

export async function save(req: Request, res: Response) {
  const data = await bodyParser(req);
  await config.set(data);

  send(res, 204);
}
