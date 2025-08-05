// Import Third-party Dependencies
import send from "@polka/send-type";
import type { Request, Response } from "express-serve-static-core";

// Import Internal Dependencies
import { context } from "../ALS.js";

export async function get(_req: Request, res: Response) {
  try {
    const { viewBuilder } = context.getStore()!;

    const templateStr = await viewBuilder.render();

    res.writeHead(200, {
      "Content-Type": "text/html"
    });
    res.end(templateStr);
  }
  catch (err: any) {
    send(res, 500, { error: err.message });
  }
}
