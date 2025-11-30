// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import { downloads } from "@nodesecure/npm-registry-sdk";

// Import Internal Dependencies
import { send } from "./util/send.ts";

export async function get(
  _: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string | undefined>
) {
  const { packageName } = params;
  if (!packageName) {
    return send(res, {
      error: "Package name is missing."
    }, { code: 400 });
  }

  try {
    const data = await downloads(`${packageName.replaceAll("%2F", "/")}`, "last-week");

    return send(res, data);
  }
  catch (error: any) {
    return send(res, { error: error.statusMessage }, {
      code: error.statusCode ?? 500
    });
  }
}
