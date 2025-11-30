// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import send from "@polka/send-type";
import { report } from "@nodesecure/report";
import type { Request, Response } from "express-serve-static-core";
import type { RC } from "@nodesecure/rc";

// Import Internal Dependencies
import { context } from "../ALS.ts";
import { cache } from "../cache.ts";
import { bodyParser } from "../middlewares/bodyParser.ts";

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

export async function post(req: Request, res: Response) {
  const body = await bodyParser(req) as {
    title: string;
    includesAllDeps: boolean;
    theme: "light" | "dark";
  };
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

    return send(res, 200, {
      data
    }, {
      "Content-type": "application/pdf"
    });
  }
  catch (err) {
    console.error(err);

    return send(
      res,
      500
    );
  }
}
