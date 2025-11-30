// Import Node.js Dependencies
import fs from "node:fs";
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Third-party Dependencies
import { report } from "@nodesecure/report";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import { context } from "../ALS.ts";
import { cache } from "../cache.ts";
import { send } from "./util/send.ts";
import { bodyParser } from "./util/bodyParser.ts";

// TODO: provide a non-file-based API on RC side ?
const kReportPayload: Partial<RC["report"]> = {
  includeTransitiveInternal: false,
  reporters: [
    "pdf"
  ],
  charts: [
    {
      name: "Extensions",
      display: true,
      interpolation: "d3.interpolateRainbow",
      type: "bar"
    },
    {
      name: "Licenses",
      display: true,
      interpolation: "d3.interpolateCool",
      type: "bar"
    },
    {
      name: "Warnings",
      display: true,
      type: "horizontalBar",
      interpolation: "d3.interpolateInferno"
    },
    {
      name: "Flags",
      display: true,
      type: "horizontalBar",
      interpolation: "d3.interpolateSinebow"
    }
  ]
};

interface ReportRequestBody {
  title: string;
  includesAllDeps: boolean;
  theme: "light" | "dark";
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse
) {
  const body = await bodyParser<ReportRequestBody>(req);
  const { title, includesAllDeps, theme } = body;

  const { dataFilePath } = context.getStore()!;

  const scannerPayload = dataFilePath ?
    JSON.parse(fs.readFileSync(dataFilePath, "utf-8")) :
    cache.getPayload((await cache.payloadsList()).current);

  const name = scannerPayload.rootDependency.name;
  const [organizationPrefixOrRepo, repo] = name.split("/");
  const reportPayload = structuredClone({
    ...kReportPayload,
    title,
    npm: {
      organizationPrefix: repo === undefined ? null : organizationPrefixOrRepo,
      packages: [repo === undefined ? organizationPrefixOrRepo : repo]
    },
    theme
  });

  try {
    const dependencies = includesAllDeps ?
      scannerPayload.dependencies :
      {
        [name]: scannerPayload.dependencies[name]
      };

    const data = await report(
      dependencies,
      reportPayload
    );

    return send(res, {
      data
    }, {
      headers: {
        "content-type": "application/pdf"
      }
    });
  }
  catch (err) {
    console.error(err);

    return send(
      res,
      void 0,
      {
        code: 500
      }
    );
  }
}
