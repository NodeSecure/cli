// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import cliui from "@topcli/cliui";
import kleur from "kleur";
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";
import ini from "ini";
import { Ok, Err } from "@openally/result";
// VARS
const { yellow, grey, cyan, white } = kleur;

function separatorLine() {
  return grey("-".repeat(80));
}

export function getCurrentRepository() {
  const config = ini.parse(fs.readFileSync(".git/config", "utf-8"));

  const originMetadata = config["remote \"origin\""];
  if (!originMetadata) {
    return Err("Cannot find origin remote.");
  }

  const [, rawPkg] = originMetadata.url.match(/github\.com(.+)\.git/) ?? [];
  if (!rawPkg) {
    return Err("OSSF Scorecard supports projects hosted on Github only.");
  }

  return Ok(rawPkg.slice(1));
}

export async function main(repo) {
  const result = typeof repo === "string" ? Ok(repo) : getCurrentRepository();

  const repository = result.unwrap();

  if (result.err) {
    console.log(white().bold(result.val));

    process.exit();
  }


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

    process.exit();
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


  for (const check of data.checks) {
    const { score, name, reason } = check;
    ui.div(
      { text: yellow(name), width: 77 },
      { text: !score || score < 0 ? 0 : score, width: 3, align: "right" }
    );

    if (reason) {
      ui.div({ text: check.reason, width: 77, padding: [0, 0, 1, 0] });
    }
  }

  console.log(ui.toString());

  process.exit();
}
