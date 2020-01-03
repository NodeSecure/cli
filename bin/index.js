#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const {
    writeFileSync, accessSync, createReadStream,
    constants: { R_OK, W_OK }
} = require("fs");
const { join, extname } = require("path");

// Require Third-party Dependencies
const { yellow, grey, white, green, cyan } = require("kleur");
const sade = require("sade");
const pacote = require("pacote");
const Spinner = require("@slimio/async-cli-spinner");
const open = require("open");
const getPort = require("get-port");
const filenamify = require("filenamify");
const ms = require("ms");

// Require Internal Dependencies
const { getRegistryURL } = require("../src/utils");
const { depWalker } = require("../src/depWalker");
const { hydrateDB, deleteDB } = require("../src/vulnerabilities");
const { cwd } = require("../index");

// CONSTANTS
const SRC_PATH = join(__dirname, "..", "src");
const REGISTRY_DEFAULT_ADDR = getRegistryURL();

// VARS
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

// Process script arguments
const prog = sade("nsecure").version("0.3.0");
console.log(grey().bold(`\n > Executing node-secure at: ${yellow().bold(process.cwd())}\n`));

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

prog
    .command("hydrate-db")
    .describe("Hydrate the vulnerabilities db")
    .action(async function hydrate() {
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
    });

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

async function autoCmd(packageName, opts) {
    await (typeof packageName === "string" ? fromCmd(packageName, opts) : cwdCmd(opts));
    httpCmd();
}

async function cwdCmd(opts) {
    const { depth: maxDepth = 4, output } = opts;

    const payload = await cwd(void 0, { verbose: true, maxDepth });
    logAndWrite(payload, output);
}

async function fromCmd(packageName, opts) {
    const { depth: maxDepth = 4, output } = opts;
    let manifest = null;

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
    accessSync(dataFilePath, R_OK | W_OK);

    // TODO: replace require with lazy-import (when available in Node.js).
    // eslint-disable-next-line
    const httpServer = require(join(SRC_PATH, "httpServer.js"));

    httpServer.get("/data", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        createReadStream(dataFilePath).pipe(res);
    });

    const port = await getPort();
    httpServer.listen(port, () => {
        const link = `http://localhost:${port}`;
        console.log(green().bold(" HTTP Server started at "), cyan().bold(link));
        open(link);
    });
}
