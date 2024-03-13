// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencikes
import { report } from "@nodesecure/report";
import send from "@polka/send-type";
import * as coBody from "co-body";

// Import Internal Dependencies
import { context } from "../context.js";

// TODO: provide a non-file-based API on RC side ?
const kReportPayload = {
  theme: "light",
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
  ],
  logoUrl: "https://avatars0.githubusercontent.com/u/29552883?s=200&v=4"
};

export async function post(req, res) {
  const body = await coBody.json(req);
  const { title, includesAllDeps } = body;

  const { dataFilePath } = context.getStore();
  const scannerPayload = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
  const reportPayload = kReportPayload;
  const rootDependencyName = scannerPayload.rootDependencyName;
  const [organizationPrefixOrRepo, repo] = rootDependencyName.split("/");
  Object.assign(reportPayload, {
    title,
    npm: {
      organizationPrefix: repo === undefined ? null : organizationPrefixOrRepo,
      packages: [repo === undefined ? organizationPrefixOrRepo : repo]
    }
  });

  try {
    const data = await report(
      reportPayload,
      includesAllDeps ? scannerPayload.dependencies : { [rootDependencyName]: scannerPayload.dependencies[rootDependencyName] }
    );

    return send(res, 200, {
      data
    }, {
      "Content-type": "application/pdf"
    });
  }
  catch {
    return send(
      res,
      500
    );
  }
}
