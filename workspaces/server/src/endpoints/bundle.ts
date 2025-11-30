// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import * as httpie from "@openally/httpie";

// Import Internal Dependencies
import { send } from "./util/send.ts";

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

export async function get(
  _: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string | undefined>
) {
  const { packageName, version } = params;
  if (!packageName) {
    return send(res, {
      error: "Package name is missing."
    }, { code: 400 });
  }

  const pkgTemplate = version ?
    `${packageName.replaceAll("%2F", "/")}@${version}` :
    packageName;
  try {
    const { data } = await httpie.get<BundlePhobiaResponse>(`${kBaseBundlePhobiaUrl}/size?package=${pkgTemplate}`);
    const { gzip, size, dependencySizes } = data;

    return send(res, {
      gzip,
      size,
      dependencySizes
    });
  }
  catch (error: any) {
    return send(res, { error: error.statusMessage }, {
      code: error.statusCode ?? 500
    });
  }
}
