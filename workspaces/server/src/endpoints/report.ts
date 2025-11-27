// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import { report } from "@nodesecure/report";
import send from "@polka/send-type";
import type { Request, Response } from "express-serve-static-core";
import { appCache } from "@nodesecure/cache";

// Import Internal Dependencies
import { context } from "../ALS.js";
import { bodyParser } from "../middlewares/bodyParser.js";

// TODO: provide a non-file-based API on RC side ?
const kReportPayload = {
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
  const body = await bodyParser(req);
  const { title, includesAllDeps, theme } = body;
  const { dataFilePath } = context.getStore()!;

  const scannerPayload = dataFilePath ?
    JSON.parse(fs.readFileSync(dataFilePath, "utf-8")) :
    appCache.getPayload((await appCache.payloadsList()).current);
  const reportPayload = structuredClone(kReportPayload);
  const rootDependencyName = scannerPayload.rootDependencyName;
  const [organizationPrefixOrRepo, repo] = rootDependencyName.split("/");
  Object.assign(reportPayload, {
    title,
    npm: {
      organizationPrefix: repo === undefined ? null : organizationPrefixOrRepo,
      packages: [repo === undefined ? organizationPrefixOrRepo : repo]
    },
    theme
  });

  try {
    const data = await report(
      includesAllDeps ? scannerPayload.dependencies : { [rootDependencyName]: scannerPayload.dependencies[rootDependencyName] },
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
