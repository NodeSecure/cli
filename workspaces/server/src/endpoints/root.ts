// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Internal Dependencies
import { context } from "../ALS.ts";
import { send } from "./util/send.ts";

export async function get(
  _req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const { viewBuilder } = context.getStore()!;

    const templateStr = await viewBuilder.render();

    res.writeHead(200, {
      "Content-Type": "text/html"
    });
    res.end(templateStr);
  }
  catch (err: any) {
    send(res, { error: err.message }, {
      code: 500
    });
  }
}
