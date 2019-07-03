#!/usr/bin/env node

require("make-promises-safe");
require("dotenv").config();

// Require Node.js Dependencies
const { readFileSync, accessSync, writeFileSync } = require("fs");
const { join } = require("path");
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const sade = require("sade");
const pacote = require("pacote");
const { white, cyan, red, yellow } = require("kleur");
const ora = require("ora");

// Require Internal Dependencies
const { depWalker } = require("../src/depWalker");

// Process script arguments
sade("nsecure [package]", true)
    .version("0.1.0")
    .describe("Run security analysis")
    .option("-p, --port", "HTTP Server port", 1337)
    .action(main)
    .parse(process.argv);

async function main(packageName, opts) {
    const CWD = process.cwd();
    console.log(white().bold(`\n > Executing node-secure at: ${cyan().bold(CWD)}\n`));

    let manifest = null;

    // if there is no option "package", then
    // read the package.json located at CWD + package.json
    if (typeof packageName === "undefined") {
        try {
            const packagePath = join(CWD, "package.json");

            accessSync(packagePath);
            const str = readFileSync(packagePath, "utf-8");
            manifest = JSON.parse(str);
        }
        catch (err) {
            console.log(red().bold("Failed to read or parse local package.json !"));
        }
    }

    // Else search the package in the npm registry with pacote
    else {
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
    }

    if (manifest === null) {
        return;
    }
    console.log("");
    const dependencies = await depWalker(manifest);
    if (dependencies === null) {
        console.log("No dependencies to proceed !");

        return;
    }

    const ret = JSON.stringify(Object.fromEntries(dependencies), null, 2);
    console.log(`Number of dependencies: ${dependencies.size}`);
    writeFileSync(join(__dirname, "..", "result.json"), ret);
}
