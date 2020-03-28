#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { writeFileSync, promises: { unlink, readdir } } = require("fs");
const { join, extname, basename } = require("path");
const { once } = require("events");

// Require Third-party Dependencies
const { yellow, grey, white, green, cyan, red } = require("kleur");
const sade = require("sade");
const pacote = require("pacote");
const Spinner = require("@slimio/async-cli-spinner");
const filenamify = require("filenamify");
const semver = require("semver");
const ms = require("ms");
const qoa = require("qoa");

// Require Internal Dependencies
const startHTTPServer = require("../src/httpServer.js");
const i18n = require("../src/i18n");
const { getRegistryURL, loadNsecureCache, writeNsecureCache } = require("../src/utils");
const { depWalker } = require("../src/depWalker");
const { hydrateDB, deleteDB } = require("../src/vulnerabilities");
const { cwd, verify } = require("../index");

// CONSTANTS
const REGISTRY_DEFAULT_ADDR = getRegistryURL();
const LOCAL_CACHE = loadNsecureCache();
const ONE_DAY = 3600000 * 24;
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

// Process script arguments
const prog = sade("nsecure").version("0.4.0");
console.log(grey().bold(`\n > ${i18n.getToken("cli.executing_at")}: ${yellow().bold(process.cwd())}\n`));

const currNodeSemVer = process.versions.node;
if (semver.lt(currNodeSemVer, "12.10.0")) {
    console.log(red().bold(` [!] ${i18n.getToken("cli.min_nodejs_version", "12.10.0")}\n`));
    process.exit(0);
}

function logAndWrite(payload, output = "nsecure-result") {
    if (payload === null) {
        console.log(i18n.getToken("cli.no_dep_to_proceed"));

        return null;
    }

    const ret = JSON.stringify(Object.fromEntries(payload), null, 2);
    const filePath = join(process.cwd(), extname(output) === ".json" ? filenamify(output) : `${filenamify(output)}.json`);
    writeFileSync(filePath, ret);
    console.log(white().bold(i18n.getToken("cli.successfully_written_json", green().bold(filePath))));

    return filePath;
}

async function checkHydrateDB() {
    const ts = Math.abs(Date.now() - LOCAL_CACHE.lastUpdated);

    if (ts > ONE_DAY) {
        await hydrateCmd();
        writeNsecureCache();
    }
}

prog
    .command("hydrate-db")
    .describe(i18n.getToken("cli.commands.hydrate_db.desc"))
    .action(hydrateCmd);

prog
    .command("cwd")
    .describe(i18n.getToken("cli.commands.cwd.desc"))
    .option("-d, --depth", i18n.getToken("cli.commands.option_depth"), 4)
    .option("-o, --output", i18n.getToken("cli.commands.option_output"), "nsecure-result")
    .action(cwdCmd);

prog
    .command("from <package>")
    .describe(i18n.getToken("cli.commands.from.desc"))
    .option("-d, --depth", i18n.getToken("cli.commands.option_depth"), 4)
    .option("-o, --output", i18n.getToken("cli.commands.option_output"), "nsecure-result")
    .action(fromCmd);

prog
    .command("auto [package]")
    .describe(i18n.getToken("cli.commands.auto.desc"))
    .option("-d, --depth", i18n.getToken("cli.commands.option_depth"), 4)
    .option("-k, --keep", i18n.getToken("cli.commands.auto.option_keep"), false)
    .action(autoCmd);

prog
    .command("open [json]")
    .describe(i18n.getToken("cli.commands.open.desc"))
    .action(httpCmd);

prog
    .command("verify <package>")
    .describe(i18n.getToken("cli.commands.verify.desc"))
    .option("-j, --json", i18n.getToken("cli.commands.verify.option_json"), true)
    .action(async(packageName, options) => {
        const returnJSON = Boolean(options.json);

        const payload = await verify(packageName);
        if (returnJSON) {
            return console.log(JSON.stringify(payload, null, 2));
        }
        console.log("CLI MODE: Not Implemented Yet!");

        return void 0;
    });

prog
    .command("lang")
    .describe(i18n.getToken("cli.commands.lang.desc"))
    .action(async() => {
        const currentLang = i18n.getLocalLang();
        const dirents = await readdir(join(__dirname, "../i18n"), { withFileTypes: true });
        const langs = dirents
            .filter((dirent) => dirent.isFile() && extname(dirent.name) === ".js")
            .map((dirent) => basename(dirent.name, ".js"));

        langs.splice(langs.indexOf(currentLang), 1);
        langs.unshift(currentLang);

        console.log("");
        const { selectedLang } = await qoa.interactive({
            query: green().bold(` ${i18n.getToken("cli.commands.lang.question_text")}`),
            handle: "selectedLang",
            menu: langs
        });

        await i18n.setLocalLang(selectedLang);
        console.log(white().bold(`\n ${i18n.getToken("cli.commands.lang.new_selection", yellow().bold(selectedLang))}`));
    });

prog.parse(process.argv);

async function hydrateCmd() {
    deleteDB();

    const spinner = new Spinner({
        text: white().bold(i18n.getToken("cli.commands.hydrate_db.running", yellow().bold("nodejs security-wg")))
    }).start();
    try {
        await hydrateDB();

        const elapsedTime = cyan(ms(Number(spinner.elapsedTime.toFixed(2))));
        spinner.succeed(white().bold(i18n.getToken("cli.commands.hydrate_db.success", elapsedTime)));
    }
    catch (err) {
        spinner.failed(err.message);
    }
}

async function autoCmd(packageName, opts) {
    const keep = Boolean(opts.keep);
    delete opts.keep;
    delete opts.k;

    const payloadFile = await (typeof packageName === "string" ? fromCmd(packageName, opts) : cwdCmd(opts));
    try {
        if (payloadFile !== null) {
            await httpCmd();
            await once(process, "SIGINT");
        }
    }
    finally {
        if (!keep && payloadFile !== null) {
            await unlink(payloadFile);
        }
    }
}

async function cwdCmd(opts) {
    const { depth: maxDepth = 4, output } = opts;

    await checkHydrateDB();
    const payload = await cwd(void 0, { verbose: true, maxDepth });

    return logAndWrite(payload, output);
}

async function fromCmd(packageName, opts) {
    const { depth: maxDepth = 4, output } = opts;
    let manifest = null;

    await checkHydrateDB();
    const spinner = new Spinner({
        text: white().bold(i18n.getToken("cli.commands.from.searching", yellow().bold(packageName)))
    }).start();
    try {
        manifest = await pacote.manifest(packageName, {
            registry: REGISTRY_DEFAULT_ADDR,
            ...token
        });

        const elapsedTime = cyan().bold(ms(Number(spinner.elapsedTime.toFixed(2))));
        spinner.succeed(
            white().bold(i18n.getToken("cli.commands.from.fetched", yellow().bold(packageName), elapsedTime))
        );
    }
    catch (err) {
        spinner.failed(err.message);

        return null;
    }

    if (manifest !== null) {
        const payload = await depWalker(manifest, { verbose: true, maxDepth });

        return logAndWrite(payload, output);
    }

    return null;
}

async function httpCmd(json = "nsecure-result.json") {
    const dataFilePath = join(process.cwd(), json);
    const httpServer = await startHTTPServer(dataFilePath);

    for (const eventName of ["SIGINT", "SIGTERM"]) {
        process.on(eventName, () => httpServer.server.close());
    }
}
