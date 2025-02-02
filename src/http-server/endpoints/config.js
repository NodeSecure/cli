// Import Third-party Dependencies
import send from "@polka/send-type";

// Import Internal Dependencies
import * as config from "../config.js";
import { bodyParser } from "../middlewares/bodyParser.js";

export async function get(_req, res) {
  const result = await config.get();

  send(res, 200, result);
}

export async function save(req, res) {
  const data = await bodyParser(req);
  await config.set(data);

  send(res, 204);
}
