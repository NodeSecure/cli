// Import Third-party Dependencies
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
