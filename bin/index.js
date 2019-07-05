#!/usr/bin/env node

"use strict";

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { writeFileSync } = require("fs");
const { join } = require("path");
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const sade = require("sade");
const pacote = require("pacote");
const { yellow, grey } = require("kleur");
const ora = require("ora");

// Require Internal Dependencies
const { depWalker } = require("../src/depWalker");
const nodeSecure = require("../index");

// Process script arguments
const prog = sade("nsecure").version("0.1.0");
console.log(grey().bold(`\n > Executing node-secure at: ${yellow().bold(process.cwd())}\n`));

function logAndWrite(payload) {
    if (payload === null) {
        console.log("No dependencies to proceed !");

        return;
    }

    const ret = JSON.stringify(Object.fromEntries(payload), null, 2);
    console.log(`Number of dependencies: ${payload.size}`);
    writeFileSync(join(__dirname, "..", "result.json"), ret);
}

prog
    .command("cwd")
    .describe("Run on the current working dir")
    .action(async function cwd() {
        const payload = await nodeSecure(void 0, { verbose: true });
        logAndWrite(payload);
    });

prog
    .command("from <package>")
    .describe("Run on the current working dir")
    .action(async function from(packageName) {
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

        const payload = await depWalker(manifest);
        logAndWrite(payload);
    });

prog.parse(process.argv);
