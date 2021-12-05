// Import Node.js Dependencies
import fs from "fs/promises";
import path from "path";

// Import Third-party Dependencies
import cliui from "cliui";
import kleur from "kleur";
import * as i18n from "@nodesecure/i18n";
import { formatBytes } from "@nodesecure/utils";

// VARS
const { yellow, gray, white, green, cyan, red } = kleur;

export async function main(json = "nsecure-result.json") {
  const dataFilePath = path.join(process.cwd(), json);
  const rawAnalysis = await fs.readFile(dataFilePath, { encoding: "utf-8" });
  const { rootDepencyName, dependencies } = JSON.parse(rawAnalysis);

  const ui = cliui();
  const title = `${white().bold(`${i18n.getToken("ui.stats.title")}:`)} ${cyan().bold(rootDepencyName)}`;
  ui.div(
    { text: title, width: 50 }
  );
  ui.div({ text: gray("-------------------------------------------------------------------"), width: 70 });

  if (dependencies) {
    const {
      packagesCount,
      packageWithIndirectDeps,
      totalSize,
      extensionMap,
      licenceMap
    } = extractAnalysisData(dependencies);

    ui.div(
      { text: white().bold(`${i18n.getToken("ui.stats.total_packages")}:`), width: 60 },
      { text: green().bold(`${packagesCount}`), width: 20 }
    );
    ui.div(
      { text: white().bold(`${i18n.getToken("ui.stats.total_size")}:`), width: 60 },
      { text: green().bold(`${formatBytes(totalSize)}`), width: 20 }
    );
    ui.div(
      { text: white().bold(`${i18n.getToken("ui.stats.indirect_deps")}:`), width: 60 },
      { text: green().bold(`${packageWithIndirectDeps}`), width: 20 }
    );

    ui.div("");
    ui.div(
      { text: white().bold(`${i18n.getToken("ui.stats.extensions")}:`), width: 40 }
    );
    const extensionEntries = Object.entries(extensionMap);
    ui.div(
      {
        text: `${extensionEntries.reduce(buildStringFromEntries, "")}`, width: 70
      }
    );

    ui.div("");
    ui.div(
      { text: white().bold(`${i18n.getToken("ui.stats.licenses")}:`), width: 40 }
    );
    const licenceEntries = Object.entries(licenceMap);
    ui.div(
      {
        text: yellow().bold(`${licenceEntries.reduce(buildStringFromEntries, "")}`), width: 70
      }
    );
  }
  else {
    ui.div(
      { text: red().bold("Error:"), width: 20 },
      { text: yellow().bold("No dependencies"), width: 30 }
    );
  }
  ui.div({ text: gray("-------------------------------------------------------------------"), width: 70 });
  console.log(ui.toString());

  return void 0;
}

// eslint-disable-next-line max-params
function buildStringFromEntries(accumulator, [extension, count], index, sourceArray) {
  // eslint-disable-next-line no-param-reassign
  accumulator += `(${yellow(count)}) ${white().bold(extension)} `;
  if (index !== sourceArray.length - 1) {
    // eslint-disable-next-line no-param-reassign
    accumulator += cyan("- ");
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

  for (const dependencyData of Object.values(dependencies)) {
    const { versions, metadata } = dependencyData;

    for (const version of Object.values(versions)) {
      extractVersionData(version, analysisAggregator);
    }

    analysisAggregator.packagesCount += metadata.dependencyCount;
  }

  return analysisAggregator;
}

function extractVersionData(version, analysisAggregator) {
  for (const extension of version.composition.extensions) {
    addOccurrences(analysisAggregator.extensionMap, extension);
  }

  if (version.license.uniqueLicenseIds) {
    for (const licence of version.license.uniqueLicenseIds) {
      addOccurrences(analysisAggregator.licenceMap, licence);
    }
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
