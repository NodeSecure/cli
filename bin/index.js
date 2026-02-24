#!/usr/bin/env node

// Load .env file if it exists (quiet - no error if missing)
try {
  process.loadEnvFile();
}
catch {
  // .env file not found or not readable - ignore silently
}

// Import Node.js Dependencies
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import { loadRegistryURLFromLocalSystem } from "@nodesecure/npm-registry-sdk";
import * as vulnera from "@nodesecure/vulnera";
import sade from "sade";
import semver from "semver";

// Import Internal Dependencies
import * as commands from "../src/commands/index.js";
import kleur from "../src/utils/styleText.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: replace with await import() when available
const require = createRequire(import.meta.url);
const manifest = require("../package.json");

await i18n.getLocalLang();
await i18n.extendFromSystemPath(
  path.join(__dirname, "..", "i18n")
);

console.log(kleur.grey().bold(`\n > ${i18n.getTokenSync("cli.executing_at")}: ${kleur.yellow().bold(process.cwd())}\n`));

const minVersion = semver.minVersion(manifest.engines.node);
if (semver.lt(process.versions.node, minVersion)) {
  console.log(kleur.red().bold(` [!] ${i18n.getTokenSync("cli.min_nodejs_version", minVersion)}\n`));
  process.exit(0);
}

loadRegistryURLFromLocalSystem();

const prog = sade("nsecure").version(manifest.version);

defaultScannerCommand("cwd", { strategy: vulnera.strategies.GITHUB_ADVISORY })
  .describe(i18n.getTokenSync("cli.commands.cwd.desc"))
  .option("-n, --nolock", i18n.getTokenSync("cli.commands.cwd.option_nolock"), false)
  .option("-f, --full", i18n.getTokenSync("cli.commands.cwd.option_full"), false)
  .action(async(options) => {
    checkNodeSecureToken();
    await commands.scanner.cwd(options);
  });

defaultScannerCommand("from <spec>")
  .describe(i18n.getTokenSync("cli.commands.from.desc"))
  .action(async(spec, options) => {
    checkNodeSecureToken();
    await commands.scanner.from(spec, options);
  });

defaultScannerCommand("auto [spec]", { includeOutput: false, strategy: vulnera.strategies.GITHUB_ADVISORY })
  .describe(i18n.getTokenSync("cli.commands.auto.desc"))
  .option("-k, --keep", i18n.getTokenSync("cli.commands.auto.option_keep"), false)
  .option("-d, --developer", i18n.getTokenSync("cli.commands.open.option_developer"), false)
  .action(async(spec, options) => {
    checkNodeSecureToken();
    await commands.scanner.auto(spec, options);
  });

prog
  .command("open [json]")
  .describe(i18n.getTokenSync("cli.commands.open.desc"))
  .option("-p, --port", i18n.getTokenSync("cli.commands.open.option_port"), process.env.PORT)
  .option("-f, --fresh-start", i18n.getTokenSync("cli.commands.open.option_fresh_start"), process.env.PORT)
  .option("-d, --developer", i18n.getTokenSync("cli.commands.open.option_developer"), false)
  .action(commands.http.start);

prog
  .command("verify [spec]")
  .describe(i18n.getTokenSync("cli.commands.verify.desc"))
  .option("-j, --json", i18n.getTokenSync("cli.commands.verify.option_json"), false)
  .action(async(spec, options) => {
    checkNodeSecureToken();
    await commands.verify.main(spec, options);
  });

prog
  .command("summary [json]")
  .describe(i18n.getTokenSync("cli.commands.summary.desc"))
  .action(commands.summary.main);

prog
  .command("scorecard [repository]")
  .describe(i18n.getTokenSync("cli.commands.scorecard.desc"))
  .option("--vcs", i18n.getTokenSync("cli.commands.scorecard.option_vcs"), "github")
  .action(commands.scorecard.main);

prog
  .command("report [repository]")
  .describe(i18n.getTokenSync("cli.commands.report.desc"))
  .option("-t, --theme", i18n.getTokenSync("cli.commands.report.option_theme"), "white")
  .option("-i, --includesAllDeps", i18n.getTokenSync("cli.commands.report.option_includesAllDeps"), true)
  .option("-l, --title", i18n.getTokenSync("cli.commands.report.option_title"), "NodeSecure Report")
  .option("-r, --reporters", i18n.getTokenSync("cli.commands.report.option_reporters"), ["html"])
  .action(commands.report.main);

prog
  .command("lang")
  .describe(i18n.getTokenSync("cli.commands.lang.desc"))
  .action(commands.lang.set);

prog
  .command("config create [configuration]")
  .option("-c, --cwd", i18n.getTokenSync("cli.commands.configCreate.option_cwd"), false)
  .describe(i18n.getTokenSync("cli.commands.configCreate.desc"))
  .action(commands.config.createConfigFile);

prog
  .command("config")
  .describe(i18n.getTokenSync("cli.commands.config.desc"))
  .action(commands.config.editConfigFile);

prog
  .command("cache")
  .option("-l, --list", i18n.getTokenSync("cli.commands.cache.option_list"), false)
  .option("-c, --clear", i18n.getTokenSync("cli.commands.cache.option_clear"), false)
  .option("-f, --full", i18n.getTokenSync("cli.commands.cache.option_full"), false)
  .describe(i18n.getTokenSync("cli.commands.cache.desc"))
  .action(commands.cache.main);

prog
  .command("extract integrity <spec>")
  .describe(i18n.getTokenSync("cli.commands.extractIntegrity.desc"))
  .example("nsecure extract integrity lodash@^4.1.2")
  .action(commands.extractIntegrity.main);

prog.parse(process.argv);

function defaultScannerCommand(name, options = {}) {
  const { includeOutput = true, strategy = null } = options;

  const cmd = prog.command(name)
    .option("-d, --depth", i18n.getTokenSync("cli.commands.option_depth"), Infinity)
    .option("--silent", i18n.getTokenSync("cli.commands.option_silent"), false)
    .option("-c, --contacts", i18n.getTokenSync("cli.commands.option_contacts"), [])
    .option("--verbose", i18n.getTokenSync("cli.commands.option_verbose"), false);

  if (includeOutput) {
    cmd.option("-o, --output", i18n.getTokenSync("cli.commands.option_output"), "nsecure-result");
  }
  if (strategy !== null) {
    cmd.option("-s, --vulnerabilityStrategy", i18n.getTokenSync("cli.commands.strategy"), strategy);
  }

  return cmd;
}

function checkNodeSecureToken() {
  if (!process.env.NODE_SECURE_TOKEN) {
    const varEnvName = kleur.yellow().bold("NODE_SECURE_TOKEN");

    console.log(
      kleur.red().bold(`${i18n.getTokenSync("cli.missingEnv", varEnvName)}\n`)
    );
  }
}
