#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { writeFileSync, promises: { unlink, readdir } } = require("fs");
const { join, extname, basename } = require("path");
const { once } = require("events");

// Require Third-party Dependencies
const { yellow, grey, white, green, cyan, red, magenta } = require("kleur");
const sade = require("sade");
const pacote = require("pacote");
const Spinner = require("@slimio/async-cli-spinner");
const filenamify = require("filenamify");
const semver = require("semver");
const ms = require("ms");
const qoa = require("qoa");
const ui = require("cliui")();

// Require Internal Dependencies
const startHTTPServer = require("../src/httpServer.js");
const i18n = require("../src/i18n");
const { getRegistryURL, loadNsecureCache, writeNsecureCache, formatBytes } = require("../src/utils");
const { depWalker } = require("../src/depWalker");
const { hydrateDB, deleteDB } = require("../src/vulnerabilities");
const { cwd, verify } = require("../index");

// CONSTANTS
const REGISTRY_DEFAULT_ADDR = getRegistryURL();
const LOCAL_CACHE = loadNsecureCache();
const ONE_DAY = 3600000 * 24;
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

// Process script arguments
const version = require("../package.json").version;
const prog = sade("nsecure").version(version);
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

    const ret = JSON.stringify(payload, null, 2);
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
    .option("-n, --nolock", i18n.getToken("cli.commands.cwd.option_nolock"), false)
    .option("-f, --full", i18n.getToken("cli.commands.cwd.option_full"), false)
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
    .command("verify [package]")
    .describe(i18n.getToken("cli.commands.verify.desc"))
    .option("-j, --json", i18n.getToken("cli.commands.verify.option_json"), false)
    .action(verifyCmd);

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

function locationToString(location) {
    const start = `${location[0][0]}:${location[0][1]}`;
    const end = `${location[1][0]}:${location[1][1]}`;

    return `[${start}] - [${end}]`;
}

async function verifyCmd(packageName = null, options) {
    const payload = await verify(packageName);
    if (options.json) {
        return console.log(JSON.stringify(payload, null, 2));
    }
    const { files, directorySize, uniqueLicenseIds, ast } = payload;

    ui.div(
        { text: cyan().bold("directory size:"), width: 20 },
        { text: yellow().bold(formatBytes(directorySize)), width: 10 }
    );
    ui.div(
        { text: cyan().bold("unique licenses:"), width: 20 },
        { text: white().bold(uniqueLicenseIds.join(", ")), width: 10 }
    );
    console.log(`${ui.toString()}\n`);
    ui.resetOutput();

    {
        ui.div(
            { text: white().bold("ext"), width: 15, align: "center" },
            { text: white().bold("files"), width: 45 },
            { text: white().bold("minified files"), width: 30 }
        );

        const maxLen = files.list.length > files.extensions.length ? files.list.length : files.extensions.length;
        const divArray = Array.from(Array(maxLen), () => ["", "", ""]);
        files.extensions.forEach((value, index) => (divArray[index][0] = value));
        files.list.forEach((value, index) => (divArray[index][1] = value));
        files.minified.forEach((value, index) => (divArray[index][2] = value));

        for (const [ext, file, min] of divArray) {
            ui.div(
                { text: cyan().bold(ext), width: 15, align: "center" },
                { text: file, width: 45 },
                { text: red().bold(min), width: 30 }
            );
        }
    }
    console.log(`${ui.toString()}\n`);
    ui.resetOutput();

    ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
    ui.div({ text: cyan().bold("Required dependency and files"), width: 70, align: "center" });
    ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
    ui.div({ text: "\n", width: 70, align: "center" });

    for (const [fileName, deps] of Object.entries(ast.dependencies)) {
        ui.div({ text: magenta().bold(fileName), width: 70, align: "center" });
        ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
        ui.div(
            { text: white().bold("required stmt"), width: 32, align: "left" },
            { text: white().bold("try/catch"), width: 12, align: "center" },
            { text: white().bold("source location"), width: 26, align: "center" }
        );
        for (const [depName, infos] of Object.entries(deps)) {
            const { start, end } = infos.location;
            const position = `[${start.line}:${start.column}] - [${end.line}:${end.column}]`;

            ui.div(
                { text: depName, width: 32 },
                { text: (infos.inTry ? green : red)().bold(infos.inTry), width: 12, align: "center" },
                { text: grey().bold(position), width: 26, align: "center" }
            );
        }
        ui.div({ text: "", width: 70, align: "center" });
        console.log(`${ui.toString()}`);
        ui.resetOutput();
    }

    ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
    ui.div({ text: cyan().bold("AST Warnings"), width: 70, align: "center" });
    ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
    ui.div({ text: "", width: 70, align: "center" });

    ui.div(
        { text: white().bold("file"), width: 30 },
        { text: white().bold("kind"), width: 15, align: "center" },
        { text: white().bold("source location"), width: 25, align: "center" }
    );

    for (const warning of ast.warnings) {
        const position = warning.kind === "encoded-literal" ?
            warning.location.map((loc) => locationToString(loc)).join(" // ") :
            locationToString(warning.location);

        ui.div(
            { text: warning.file || grey().bold("NONE"), width: 30 },
            { text: magenta().bold(warning.kind), width: 15, align: "center" },
            { text: grey().bold(position), width: 25, align: "center" }
        );
        if (warning.value) {
            ui.div({ text: "", width: 70, align: "center" });
            ui.div({ text: yellow().bold(warning.value), width: 70, align: "center" });
        }
        ui.div({ text: grey("-------------------------------------------------------------------"), width: 70 });
    }

    console.log(`${ui.toString()}`);
    ui.resetOutput();

    return void 0;
}

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
            try {
                await unlink(payloadFile);
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

async function cwdCmd(opts) {
    const { depth: maxDepth = 4, output, nolock, full } = opts;

    await checkHydrateDB();
    const payload = await cwd(void 0, { verbose: true, maxDepth, usePackageLock: !nolock, fullLockMode: full });

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
