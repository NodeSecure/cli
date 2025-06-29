// Import Third-party Dependencies
import { downloads } from "@nodesecure/npm-registry-sdk";
import send from "@polka/send-type";
import type { Request, Response } from "express-serve-static-core";

export async function get(req: Request, res: Response) {
  const { pkgName } = req.params;

  try {
    const data = await downloads(`${pkgName.replaceAll("%2F", "/")}`, "last-week");

    return send(res, 200, data);
  }
  catch (error: any) {
    return send(res, error.statusCode, { error: error.statusMessage });
  }
}
