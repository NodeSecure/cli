// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";

// Import Internal Dependencies
import { send } from "./util/send.ts";

interface Params {
  org: string;
  packageName: string;
}

interface Query {
  platform?: "github.com" | "gitlab.com";
}

// eslint-disable-next-line max-params
export async function get(
  _: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string | undefined>,
  _store: unknown,
  querystring: Record<string, string | undefined>
) {
  const { org, packageName } = params as unknown as Params;
  const { platform = "github.com" } = querystring as Query;

  try {
    const data = await scorecard.result(`${org}/${packageName}`, {
      resolveOnVersionControl: Boolean(process.env.GITHUB_TOKEN),
      resolveOnNpmRegistry: false,
      platform
    });

    return send(res, {
      data
    });
  }
  catch (error: any) {
    return send(
      res,
      { error: error.statusMessage ?? "Not Found" },
      {
        code: error.statusCode ?? 404
      }
    );
  }
}
