// Import Node.js Dependencies
import fs from "fs";

// Import Third-party Dependencies
import cliui from "@topcli/cliui";
import kleur from "kleur";
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";
import ini from "ini";

// VARS
const { yellow, grey, cyan, white } = kleur;

function separatorLine() {
  return grey("-".repeat(80));
}

export function getCurrentRepository() {
  // eslint-disable-next-line no-sync
  const config = ini.parse(fs.readFileSync(".git/config", "utf-8"));

  const originMetadata = config["remote \"origin\""];
  if (!originMetadata) {
    console.log(
      kleur
        .white()
        .bold(white().bold("Cannot find origin remote."))
    );

    process.exit();
  }

  if (!originMetadata.url.includes("github")) {
    console.log(
      kleur
        .white()
        .bold(white().bold("OSSF Scorecard supports projects hosted on Github only."))
    );

    process.exit();
  }

  const [, pkg] = originMetadata.url.match(/github\.com(.+)\.git/);

  return pkg.slice(1);
}

export async function main(repo) {
  const repository = repo ?? getCurrentRepository();
  let data;

  try {
    data = await scorecard.result(repository);
  }
  catch (error) {
    console.log(
      kleur
        .white()
        .bold(white().bold(`${repository} is not part of the OSSF Scorecard BigQuery public dataset.`))
    );

    return;
  }

  const ui = cliui({ width: 80 });

  ui.div({ text: cyan("OSSF Scorecard"), align: "center", padding: [1, 1, 1, 1] });

  ui.div(
    { text: "Repository", width: 20 },
    { text: repository, width: 60, align: "right" }
  );
  ui.div(
    { text: "Scan at", width: 60 },
    { text: data.date, width: 20, align: "right" }
  );
  ui.div(
    { text: "Score", width: 60 },
    { text: data.score, width: 20, align: "right" }
  );
  ui.div(separatorLine());

  function normalizeScore(score) {
    if (!score || score < 0) {
      return white().bold(0);
    }

    return white().bold(score);
  }

  for (const check of data.checks) {
    ui.div(
      { text: yellow(check.name), width: 77 },
      { text: normalizeScore(check.score), width: 3, align: "right" }
    );

    if (check.reason) {
      ui.div({ text: check.reason, width: 77, padding: [0, 0, 1, 0] });
    }
  }

  console.log(ui.toString());

  return;
}
