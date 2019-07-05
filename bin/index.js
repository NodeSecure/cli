#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { writeFileSync, accessSync, createReadStream, constants: { R_OK, W_OK } } = require("fs");
const { join } = require("path");
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const sade = require("sade");
const pacote = require("pacote");
const { yellow, grey, white, green, cyan } = require("kleur");
const ora = require("ora");

// Require Internal Dependencies
const { depWalker } = require("../src/depWalker");
const nodeSecure = require("../index");

// CONSTANTS
const SRC_PATH = join(__dirname, "..", "src");

// Process script arguments
const prog = sade("nsecure").version("0.1.0");
console.log(grey().bold(`\n > Executing node-secure at: ${yellow().bold(process.cwd())}\n`));

function logAndWrite(payload, output = "result") {
    if (payload === null) {
        console.log("No dependencies to proceed !");

        return;
    }

    const ret = JSON.stringify(Object.fromEntries(payload), null, 2);
    const filePath = join(process.cwd(), `${output}.json`);
    writeFileSync(filePath, ret);
    console.log(white().bold(`Sucessfully result .json file at: ${green().bold(filePath)}`));
}

prog
    .command("cwd")
    .describe("Run on the current working dir")
    .option("-d, --depth", "maximum dependencies deepth", 2)
    .option("-o, --output", "output name", "result")
    .action(async function cwd(opts) {
        const { depth = 2, output } = opts;

        const payload = await nodeSecure(void 0, { verbose: true, maxDepth: depth });
        logAndWrite(payload, output);
    });

prog
    .command("from <package>")
    .describe("Run on a given package from npm registry")
    .option("-d, --depth", "maximum dependencies deepth", 2)
    .option("-o, --output", "output name", "result")
    .action(async function from(packageName, opts) {
        const { depth = 2, output } = opts;
        let manifest = null;

        const spinner = ora(`Searching for '${yellow().bold(packageName)}' manifest in npm registry!`).start();
        try {
            const start = performance.now();
            manifest = await pacote.manifest(packageName);
            const time = (performance.now() - start).toFixed(2);
            spinner.succeed(`Succeed in ${time} ms`);
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
    .command("http <json>")
    .describe("Run an HTTP Server with a given analysis .JSON")
    .option("-p, --port", "http server port", 1338)
    .action((json, opts) => {
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
            console.log(green().bold("HTTP Server started: "), cyan().bold(`http://localhost:${opts.port}`));
        });
    });

prog.parse(process.argv);
