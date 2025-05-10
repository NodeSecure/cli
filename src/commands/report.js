// Import Third-party Dependencies
import { report } from "@nodesecure/report";
import * as Scanner from "@nodesecure/scanner";

// CONSTANTS
const kSupportedReporters = new Set(["html", "pdf"]);
const kReportPayload = {
  includeTransitiveInternal: false,
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
export async function main(repository, options) {
  const {
    theme,
    includesAllDeps,
    title,
    reporters
  } = options;

  const [organizationPrefixOrRepo, repo] = repository.split("/");

  const formattedReporters = new Set(Array.isArray(reporters) ? reporters : [reporters]);
  for (const reporter of formattedReporters) {
    if (!kSupportedReporters.has(reporter)) {
      console.error(`Reporter '${reporter}' is not supported`);
      process.exit();
    }
  }

  const reportPayload = {
    ...kReportPayload,
    npm: {
      organizationPrefix: repo === undefined ? null : organizationPrefixOrRepo,
      packages: [repo === undefined ? organizationPrefixOrRepo : repo]
    },
    theme,
    title,
    reporters: [...formattedReporters],
    saveOnDisk: true
  };
  const scannerPayload = await Scanner.from(repository);

  const reportPath = await report(
    includesAllDeps ? scannerPayload.dependencies : { [repository]: scannerPayload.dependencies[repository] },
    reportPayload,
    {
      reportOutputLocation: process.cwd(),
      savePDFOnDisk: formattedReporters.has("pdf"),
      saveHTMLOnDisk: formattedReporters.has("html")
    }
  );

  console.log("Successfully generated report", reportPath);
}
