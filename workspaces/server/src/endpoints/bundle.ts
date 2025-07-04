// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import send from "@polka/send-type";
import type { Request, Response } from "express-serve-static-core";

// CONSTANTS
const kBaseBundlePhobiaUrl = "https://bundlephobia.com/api";

interface BundlePhobiaResponse {
  gzip: number;
  size: number;
  dependencySizes: {
    approximateSize: number;
    name: string;
  }[];
}

export async function get(req: Request, res: Response) {
  const { pkgName, version } = req.params;

  const pkgTemplate = version ? `${pkgName.replaceAll("%2F", "/")}@${version}` : pkgName;
  try {
    const { data } = await httpie.get<BundlePhobiaResponse>(`${kBaseBundlePhobiaUrl}/size?package=${pkgTemplate}`);
    const { gzip, size, dependencySizes } = data;

    return send(res, 200, {
      gzip,
      size,
      dependencySizes
    });
  }
  catch (error: any) {
    return send(res, error.statusCode, { error: error.statusMessage });
  }
}
