// Import Node.js Dependencies
import fs from "node:fs/promises";
import path from "node:path";
import { styleText } from "node:util";

// Import Third-party Dependencies
import cliui from "@topcli/cliui";
import * as i18n from "@nodesecure/i18n";
import { formatBytes } from "@nodesecure/utils";

function separatorLine() {
  return styleText("grey", "-".repeat(80));
}

export async function main(json = "nsecure-result.json") {
  await i18n.getLocalLang();
  const dataFilePath = path.join(process.cwd(), json);
  const rawAnalysis = await fs.readFile(dataFilePath, { encoding: "utf-8" });
  const { rootDependencyName, dependencies } = JSON.parse(rawAnalysis);

  const ui = cliui({ width: 80 });
  const title = `${styleText(["white", "bold"],
    `${i18n.getTokenSync("ui.stats.title")}:`)} ${styleText(["cyan", "bold"], rootDependencyName)}`;
  ui.div(
    { text: title, width: 50 }
  );
  ui.div({ text: separatorLine() });

  if (dependencies) {
    const {
      packagesCount,
      packageWithIndirectDeps,
      totalSize,
      extensionMap,
      licenceMap
    } = extractAnalysisData(dependencies);

    ui.div(
      { text: styleText(["white", "bold"], `${i18n.getTokenSync("ui.stats.total_packages")}:`), width: 60 },
      { text: styleText(["green", "bold"], `${packagesCount}`), width: 20, align: "right" }
    );
    ui.div(
      { text: styleText(["white", "bold"], `${i18n.getTokenSync("ui.stats.total_size")}:`), width: 60 },
      { text: styleText(["green", "bold"], `${formatBytes(totalSize)}`), width: 20, align: "right" }
    );
    ui.div(
      { text: styleText(["white", "bold"], `${i18n.getTokenSync("ui.stats.indirect_deps")}:`), width: 60 },
      { text: styleText(["green", "bold"], `${packageWithIndirectDeps}`), width: 20, align: "right" }
    );

    ui.div("");
    ui.div(
      { text: styleText(["white", "bold"], `${i18n.getTokenSync("ui.stats.extensions")}:`), width: 40 }
    );
    const extensionEntries = Object.entries(extensionMap);
    ui.div(
      {
        text: `${extensionEntries.reduce(buildStringFromEntries, "")}`
      }
    );

    ui.div("");
    ui.div(
      { text: styleText(["white", "bold"], `${i18n.getTokenSync("ui.stats.licenses")}:`), width: 40 }
    );
    const licenceEntries = Object.entries(licenceMap);
    ui.div(
      {
        text: styleText(["yellow", "bold"], `${licenceEntries.reduce(buildStringFromEntries, "")}`)
      }
    );
  }
  else {
    ui.div(
      { text: styleText(["red", "bold"], "Error:"), width: 20 },
      { text: styleText(["yellow", "bold"], "No dependencies"), width: 30 }
    );
  }
  ui.div({ text: separatorLine() });
  console.log(ui.toString());

  return void 0;
}

// eslint-disable-next-line max-params
function buildStringFromEntries(accumulator, [extension, count], index, sourceArray) {
  // eslint-disable-next-line no-param-reassign
  accumulator += `(${styleText("yellow", count)}) ${styleText(["white", "bold"], extension)} `;
  if (index !== sourceArray.length - 1) {
    // eslint-disable-next-line no-param-reassign
    accumulator += styleText("cyan", "- ");
  }

  return accumulator;
}

function extractAnalysisData(dependencies) {
  const analysisAggregator = {
    packagesCount: 0,
    totalSize: 0,
    packageWithIndirectDeps: 0,
    extensionMap: {},
    licenceMap: {}
  };

  for (const { versions } of Object.values(dependencies)) {
    for (const version of Object.values(versions)) {
      extractVersionData(version, analysisAggregator);
    }

    analysisAggregator.packagesCount += 1;
  }

  return analysisAggregator;
}

function extractVersionData(version, analysisAggregator) {
  for (const extension of version.composition.extensions) {
    addOccurrences(analysisAggregator.extensionMap, extension);
  }

  for (const licence of version.uniqueLicenseIds) {
    addOccurrences(analysisAggregator.licenceMap, licence);
  }

  if (version.flags && version.flags.includes("hasIndirectDependencies")) {
    analysisAggregator.packageWithIndirectDeps++;
  }

  analysisAggregator.totalSize += version.size;
}

function addOccurrences(aggregator, key) {
  if (aggregator[key]) {
    aggregator[key]++;
  }
  else {
    aggregator[key] = 1;
  }
}
