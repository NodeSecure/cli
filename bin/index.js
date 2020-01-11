#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { writeFileSync } = require("fs");
const { join, extname } = require("path");

// Require Third-party Dependencies
const { yellow, grey, white, green, cyan, red } = require("kleur");
const sade = require("sade");
const pacote = require("pacote");
const Spinner = require("@slimio/async-cli-spinner");
const filenamify = require("filenamify");
const semver = require("semver");
const ms = require("ms");

// Require Internal Dependencies
const startHTTPServer = require("../src/httpServer.js");
const { getRegistryURL, loadNsecureCache, writeNsecureCache } = require("../src/utils");
const { depWalker } = require("../src/depWalker");
const { hydrateDB, deleteDB } = require("../src/vulnerabilities");
const { cwd } = require("../index");

// CONSTANTS
const REGISTRY_DEFAULT_ADDR = getRegistryURL();
const LOCAL_CACHE = loadNsecureCache();
const ONE_DAY = 3600000 * 24;
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

// Process script arguments
const prog = sade("nsecure").version("0.4.0");
console.log(grey().bold(`\n > Executing node-secure at: ${yellow().bold(process.cwd())}\n`));

const currNodeSemVer = process.versions.node;
if (semver.lt(currNodeSemVer, "12.10.0")) {
    console.log(red().bold(" [!] node-secure require at least Node.js v12.10.0 to work! Please upgrade your Node.js version.\n"));
    process.exit(0);
}

function logAndWrite(payload, output = "nsecure-result") {
    if (payload === null) {
        console.log("No dependencies to proceed !");

        return;
    }

    const ret = JSON.stringify(Object.fromEntries(payload), null, 2);
    const filePath = join(process.cwd(), extname(output) === ".json" ? filenamify(output) : `${filenamify(output)}.json`);
    writeFileSync(filePath, ret);
    console.log(white().bold(`Successfully writed .json file at: ${green().bold(filePath)}`));
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
    .describe("Hydrate the vulnerabilities db")
    .action(hydrateCmd);

prog
    .command("cwd")
    .describe("Run security analysis on the current working dir")
    .option("-d, --depth", "maximum dependencies depth to fetch", 4)
    .option("-o, --output", "json file output name", "nsecure-result")
    .action(cwdCmd);

prog
    .command("from <package>")
    .describe("Run security analysis on a given package from npm registry")
    .option("-d, --depth", "maximum dependencies depth to fetch", 4)
    .option("-o, --output", "json file output name", "nsecure-result")
    .action(fromCmd);

prog
    .command("auto [package]")
    .option("-d, --depth", "maximum dependencies depth to fetch", 4)
    .describe("Run security analysis on cwd or a given package and automatically open the web interface")
    .action(autoCmd);

prog
    .command("open [json]")
    .describe("Run an HTTP Server with a given nsecure JSON file")
    .action(httpCmd);

prog.parse(process.argv);

async function hydrateCmd() {
    deleteDB();

    const spinner = new Spinner({
        text: white().bold(`Hydrating local vulnerabilities with '${yellow().bold("nodejs security-wg")} db'`)
    }).start();
    try {
        await hydrateDB();
        spinner.succeed(white().bold(`Successfully hydrated vulnerabilities db in ${cyan(ms(spinner.elapsedTime))}`));
    }
    catch (err) {
        spinner.failed(err.message);
    }
}

async function autoCmd(packageName, opts) {
    await (typeof packageName === "string" ? fromCmd(packageName, opts) : cwdCmd(opts));
    await httpCmd();
}

async function cwdCmd(opts) {
    const { depth: maxDepth = 4, output } = opts;

    await checkHydrateDB();
    const payload = await cwd(void 0, { verbose: true, maxDepth });
    logAndWrite(payload, output);
}

async function fromCmd(packageName, opts) {
    const { depth: maxDepth = 4, output } = opts;
    let manifest = null;

    await checkHydrateDB();
    const spinner = new Spinner({
        text: white().bold(`Searching for '${yellow().bold(packageName)}' manifest in the npm registry!`)
    }).start();
    try {
        manifest = await pacote.manifest(packageName, {
            registry: REGISTRY_DEFAULT_ADDR,
            ...token
        });
        const elapsedTime = ms(spinner.elapsedTime.toFixed(2));
        spinner.succeed(
            white().bold(`Fetched ${yellow().bold(packageName)} manifest on npm in ${cyan(elapsedTime)}`)
        );
    }
    catch (err) {
        spinner.failed(err.message);
    }

    if (manifest !== null) {
        const payload = await depWalker(manifest, { verbose: true, maxDepth });
        logAndWrite(payload, output);
    }
}

async function httpCmd(json = "nsecure-result.json") {
    const dataFilePath = join(process.cwd(), json);
    await startHTTPServer(dataFilePath);
}
