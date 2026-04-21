// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import semver from "semver";
import filenamify from "filenamify";
import * as i18n from "@nodesecure/i18n";
import ms from "ms";

// Import Internal Dependencies
import kleur from "../../utils/styleText.js";

export function log(token, ...args) {
  console.log(kleur.white().bold(i18n.getTokenSync(token, ...args)));
}

export function logError(token, ...args) {
  console.log(kleur.red().bold(i18n.getTokenSync(token, ...args)));
}

export function logScannerStat(stat, isVerbose = true) {
  console.log(kleur.bold.white(
    i18n.getTokenSync("cli.stat",
      isVerbose ? kleur.blue().bold("verbose ") : "",
      stat.name,
      colorExecutionTime(stat.executionTime),
      stat.tarball?.path ? ` ${i18n.getTokenSync("cli.tarballStats.path", stat.tarball.path)}` : "",
      stat.tarball?.filesCount ? ` ${i18n.getTokenSync("cli.tarballStats.filesCount", stat.tarball.filesCount)}` : ""
    )));
}

export function logScannerError(error, phase) {
  console.log(kleur.bold.white(
    i18n.getTokenSync("cli.error.name",
      kleur.red().bold("error"),
      error.name
    )));

  if (error.message) {
    console.log(i18n.getTokenSync("cli.error.message",
      error.message
    ));
  }

  if (phase) {
    console.log(i18n.getTokenSync("cli.error.phase",
      phase
    ));
  }

  if (error.statusCode) {
    console.log(i18n.getTokenSync("cli.error.statusCode",
      error.statusCode
    ));
  }

  console.log(i18n.getTokenSync("cli.error.executionTime",
    colorExecutionTime(error.executionTime)
  ));

  if (error.stack) {
    console.log(i18n.getTokenSync("cli.error.stack",
      error.stack
    ));
  }
}

export function formatMs(time) {
  return ms(Number(time.toFixed(2)));
}

function colorExecutionTime(timeMs) {
  const formatted = formatMs(timeMs);
  if (timeMs <= 1_000) {
    return kleur.green().bold(formatted);
  }
  else if (timeMs <= 5_000) {
    return kleur.cyan().bold(formatted);
  }
  else if (timeMs <= 30_000) {
    return kleur.yellow().bold(formatted);
  }

  return kleur.red().bold(formatted);
}

export async function logAndWrite(
  /** @type {import("@nodesecure/scanner").Payload} */
  payload,
  output = "nsecure-result",
  options = {}
) {
  const { local = false, showWarnings = true } = options;

  if (payload === null) {
    console.log(i18n.getTokenSync("cli.no_dep_to_proceed"));

    return null;
  }

  if (showWarnings && payload.warnings.length > 0) {
    console.log(`\n ${kleur.yellow().bold("Global Warning:")}\n`);
    const logFn = semver.satisfies(payload.scannerVersion, ">=7.0.0") ?
      logGlobalWarningsV7 :
      logGlobalWarningsV6;
    logFn(payload.warnings);
    console.log("");
  }

  const ret = JSON.stringify(payload, null, 2);

  if (local) {
    // FIXME: would it make more sense to manage this directly within Scanner?
    Object.assign(ret, { local });
  }

  const fileName = path.extname(output) === ".json" ?
    filenamify(output) :
    `${filenamify(output)}.json`;
  const filePath = path.join(process.cwd(), fileName);
  fs.writeFileSync(filePath, ret);

  console.log("");
  console.log(
    kleur.white().bold(i18n.getTokenSync("cli.successfully_written_json", kleur.green().bold(filePath)))
  );
  console.log("");

  return filePath;
}

function logGlobalWarningsV7(
  /** @type {import("@nodesecure/scanner").GlobalWarning[]} */
  warnings
) {
  for (const warning of warnings) {
    const isTypoSquatting = warning.type === "typo-squatting";

    const type = kleur[isTypoSquatting ? "cyan" : "yellow"]().bold(`${warning.type}`);
    console.log(kleur.gray().bold(`[${type}] ${warning.message}`));
  }
}

function logGlobalWarningsV6(
  /** @type {string[]} */
  warnings
) {
  for (const warning of warnings) {
    console.log(kleur.yellow().bold(warning));
  }
}
