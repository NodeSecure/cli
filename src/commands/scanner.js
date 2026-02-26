// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";
import events from "node:events";

// Import Third-party Dependencies
import semver from "semver";
import filenamify from "filenamify";
import { Spinner } from "@topcli/spinner";
import ms from "ms";
import * as i18n from "@nodesecure/i18n";
import * as scanner from "@nodesecure/scanner";
import { cache } from "@nodesecure/server";

// Import Internal Dependencies
import kleur from "../utils/styleText.js";
import * as http from "./http.js";
import { parseContacts } from "./parsers/contacts.js";

export async function auto(spec, options) {
  const { keep, ...commandOptions } = options;

  const optionsWithContacts = {
    ...commandOptions,
    highlight: {
      contacts: parseContacts(options.contacts)
    }
  };

  const payloadFile = await (
    typeof spec === "string" ?
      from(spec, optionsWithContacts) :
      cwd(optionsWithContacts)
  );
  try {
    if (payloadFile !== null) {
      const developer = Boolean(commandOptions.developer);

      await http.start(void 0, {
        developer
      });
      await events.once(process, "SIGINT");
    }
  }
  finally {
    if (!keep && payloadFile !== null) {
      try {
        fs.unlinkSync(payloadFile);
      }
      catch (error) {
        if (error.code !== "ENOENT") {
          // eslint-disable-next-line no-unsafe-finally
          throw error;
        }
      }
    }
  }
}

export async function cwd(options) {
  const {
    depth: maxDepth = Infinity,
    output,
    nolock,
    full,
    vulnerabilityStrategy,
    silent,
    contacts,
    verbose
  } = options;

  const payload = await scanner.workingDir(
    process.cwd(),
    {
      maxDepth, usePackageLock: !nolock, fullLockMode: full, vulnerabilityStrategy, highlight:
        { contacts: parseContacts(contacts) }, isVerbose: verbose
    },
    initLogger(void 0, !silent)
  );

  return await logAndWrite(payload, output, { local: true });
}

export async function from(spec, options) {
  const { depth: maxDepth = Infinity, output, silent, contacts, vulnerabilityStrategy, verbose } = options;

  const payload = await scanner.from(
    spec,
    {
      maxDepth,
      vulnerabilityStrategy,
      highlight: {
        contacts: parseContacts(contacts)
      },
      isVerbose: verbose
    },
    initLogger(spec, !silent)
  );

  return await logAndWrite(payload, output);
}

const spinners = [];

function initLogger(spec, verbose = true) {
  const spinner = {
    walkTree: buildSpinner(verbose),
    tarball: buildSpinner(verbose),
    registry: buildSpinner(verbose),
    fetchManifest: buildSpinner(verbose),
    i18n: {
      start: {
        fetchManifest: "cli.commands.from.searching",
        walkTree: "depWalker.fetch_and_walk_deps",
        tarball: "depWalker.waiting_tarball",
        registry: "depWalker.fetch_on_registry"
      },
      tick: {
        tarball: "depWalker.fetch_metadata",
        registry: "depWalker.fetch_on_registry"
      },
      end: {
        fetchManifest: "cli.commands.from.fetched",
        walkTree: "depWalker.success_fetch_deptree",
        tarball: "depWalker.success_tarball",
        registry: "depWalker.success_registry_metadata"
      }
    }
  };

  function buildSpinner(verbose) {
    const spinner = new Spinner({ verbose });
    spinners.push(spinner);

    return spinner;
  }

  const logger = new scanner.Logger();
  logger.on("start", (eventName) => {
    if (!(eventName in spinner)) {
      return;
    }

    if (eventName === "fetchManifest") {
      spinner[eventName]
        .start(kleur.white().bold(i18n.getTokenSync(spinner.i18n.start[eventName], kleur.green().bold(spec))));
    }
    else {
      spinner[eventName]
        .start(kleur.white().bold(i18n.getTokenSync(spinner.i18n.start[eventName])));
    }
  });

  logger.on("tick", (eventName) => {
    if (!(eventName in spinner) || eventName === "walkTree") {
      return;
    }

    const stats = kleur.gray().bold(`[${kleur.yellow().bold(logger.count(eventName))}/${logger.count("walkTree")}]`);
    spinner[eventName].text = kleur.white().bold(`${i18n.getTokenSync(spinner.i18n.tick[eventName])} ${stats}`);
  });

  logger.on("end", (eventName) => {
    if (!(eventName in spinner)) {
      return;
    }

    const spin = spinner[eventName];
    const tokenName = spinner.i18n.end[eventName];
    const execTime = kleur.cyan().bold(formatMs(spin.elapsedTime));

    if (eventName === "walkTree") {
      spin.succeed(kleur.white().bold(
        i18n.getTokenSync(tokenName, kleur.yellow().bold(i18n.getTokenSync("depWalker.dep_tree")), execTime)));
      spin.succeeded = true;
    }
    else if (eventName === "registry") {
      spin.succeed(kleur.white().bold(i18n.getTokenSync(tokenName)));
      spin.succeeded = true;
    }
    else if (eventName === "tarball") {
      spin.succeed(kleur.white().bold(i18n.getTokenSync(tokenName, kleur.green().bold(logger.count("walkTree")), execTime)));
      spin.succeeded = true;
    }
    else if (eventName === "fetchManifest") {
      spin.succeed(kleur.white().bold(i18n.getTokenSync(tokenName, kleur.green().bold(spec), execTime)));
      spin.succeeded = true;
      console.log("");
    }
  });

  logger.on("stat", (stat) => {
    stopSpinners();
    console.log(kleur.bold.white(
      i18n.getTokenSync("cli.stat",
        kleur.blue().bold("verbose"),
        stat.name,
        kleur.cyan().bold(formatMs(stat.executionTime))
      )));
    startSpinners();
  });

  logger.on("error", (error, phase) => {
    stopSpinners();

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
      kleur.cyan().bold(formatMs(error.executionTime))
    ));

    if (error.stack) {
      console.log(i18n.getTokenSync("cli.error.stack",
        error.stack
      ));
    }

    startSpinners();
  });

  return logger;
}

function formatMs(time) {
  return ms(Number(time.toFixed(2)));
}

function stopSpinners() {
  spinners.forEach((spinner) => {
    if (!spinner.succeeded) {
      spinner.stop();
    }
  });
}

function startSpinners() {
  spinners.forEach((spinner) => {
    if (!spinner.succeeded) {
      spinner.start();
    }
  });
}

async function logAndWrite(
  /** @type {import("@nodesecure/scanner").Payload} */
  payload,
  output = "nsecure-result",
  options = {}
) {
  const { local = false } = options;

  if (payload === null) {
    console.log(i18n.getTokenSync("cli.no_dep_to_proceed"));

    return null;
  }

  if (payload.warnings.length > 0) {
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
  console.log(kleur.white().bold(i18n.getTokenSync("cli.successfully_written_json", kleur.green().bold(filePath))));
  console.log("");

  await cache.setRootPayload(payload, { logging: false, local });

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
