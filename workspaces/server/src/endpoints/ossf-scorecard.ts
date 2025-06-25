// Import Third-party Dependencies
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";
import send from "@polka/send-type";
import type { Request, Response } from "express-serve-static-core";

interface Params {
  org: string;
  pkgName: string;
}

interface Query {
  platform?: "github.com" | "gitlab.com";
}

export async function get(req: Request<Params, scorecard.ScorecardResult, null, Query>, res: Response) {
  const { org, pkgName } = req.params;
  const { platform = "github.com" } = req.query;

  try {
    const data = await scorecard.result(`${org}/${pkgName}`, {
      resolveOnVersionControl: Boolean(process.env.GITHUB_TOKEN),
      resolveOnNpmRegistry: false,
      platform
    });

    return send(res, 200, {
      data
    });
  }
  catch (error: any) {
    return send(
      res,
      error.statusCode ?? 404,
      { error: error.statusMessage ?? "Not Found" }
    );
  }
}
