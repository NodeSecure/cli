#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const {
    writeFileSync, accessSync, createReadStream, unlinkSync,
    constants: { R_OK, W_OK }
} = require("fs");
const { join, extname } = require("path");
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const sade = require("sade");
const pacote = require("pacote");
const { yellow, grey, white, green, cyan } = require("kleur");
const Spinner = require("@slimio/async-cli-spinner");
const open = require("open");
const premove = require("premove");

// Require Internal Dependencies
const { depWalker } = require("../src/depWalker");
const hydrateVulnDB = require("../src/hydrateVulnDB");
const nodeSecure = require("../index");

// CONSTANTS
const SRC_PATH = join(__dirname, "..", "src");

// VARS
const token = typeof process.env.NODE_SECURE_TOKEN === "string" ? { token: process.env.NODE_SECURE_TOKEN } : {};

// Process script arguments
const prog = sade("nsecure").version("0.1.0");
console.log(grey().bold(`\n > Executing node-secure at: ${yellow().bold(process.cwd())}\n`));

function logAndWrite(payload, output = "result") {
    if (payload === null) {
        console.log("No dependencies to proceed !");

        return;
    }

    const ret = JSON.stringify(Object.fromEntries(payload), null, 2);
    const filePath = join(process.cwd(), extname(output) === ".json" ? output : `${output}.json`);
    writeFileSync(filePath, ret);
    console.log(white().bold(`Sucessfully result .json file at: ${green().bold(filePath)}`));
}

prog
    .command("hydrate-db")
    .describe("Hydrate the vulnerabilities db")
    .action(async function hydrate() {
        try {
            unlinkSync(join(__dirname, "..", "vuln.db"));
        }
        catch (err) {
            // ignore
        }

        const spinner = new Spinner({
            text: white().bold(`Hydrating local vulnerabilities db from '${yellow().bold("nodejs security-wg")}'`)
        }).start();
        try {
            const start = performance.now();
            await hydrateVulnDB();
            const time = (performance.now() - start).toFixed(2);
            spinner.succeed(white().bold(`Successfully hydrated local db in ${cyan(time)} ms`));
        }
        catch (err) {
            spinner.failed(err.message);
        }
    });

prog
    .command("cwd")
    .describe("Run on the current working dir")
    .option("-d, --depth", "maximum dependencies deepth", 4)
    .option("-o, --output", "output name", "result")
    .action(async function cwd(opts) {
        const { depth = 4, output } = opts;

        const payload = await nodeSecure(void 0, { verbose: true, maxDepth: depth });
        logAndWrite(payload, output);
    });

prog
    .command("from <package>")
    .describe("Run on a given package from npm registry")
    .option("-d, --depth", "maximum dependencies deepth", 4)
    .option("-o, --output", "output name", "result")
    .action(async function from(packageName, opts) {
        const { depth = 4, output } = opts;
        let manifest = null;

        const spinner = new Spinner({
            text: white().bold(`Searching for '${yellow().bold(packageName)}' manifest in npm registry!`)
        }).start();
        try {
            const start = performance.now();
            manifest = await pacote.manifest(packageName, token);
            const time = (performance.now() - start).toFixed(2);
            spinner.succeed(white().bold(`Fetched '${yellow().bold(packageName)}' manifest in ${cyan(time)} ms`));
        }
        catch (err) {
            spinner.fail(err.message);
        }

        if (manifest === null) {
            return;
        }

        const payload = await depWalker(manifest, { verbose: true, maxDepth: depth });
        logAndWrite(payload, output);
    });

prog
    .command("http [json]")
    .describe("Run an HTTP Server with a given analysis .JSON")
    .option("-p, --port", "http server port", 1338)
    .action((json = "result.json", opts) => {
        const dataFilePath = join(process.cwd(), json);
        accessSync(dataFilePath, R_OK | W_OK);

        // TODO: replace require with lazy-import (when available in Node.js).
        // eslint-disable-next-line
        const httpServer = require(join(SRC_PATH, "httpServer.js"));

        httpServer.get("/data", (req, res) => {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            createReadStream(dataFilePath).pipe(res);
        });

        httpServer.listen(opts.port, () => {
            const link = `http://localhost:${opts.port}`;
            console.log(green().bold("HTTP Server started: "), cyan().bold(link));
            open(link);
        });
    });

prog.parse(process.argv);
