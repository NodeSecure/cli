"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const { readdir, readFile, writeFile } = require("fs").promises;

// Require Third-party Dependencies
const download = require("@slimio/github");
const premove = require("premove");

// CONSTANTS
const REPO = "nodejs.security-wg";
const VULN_DIR_PATH = join("vuln", "npm");

async function readVulnJSONFile(path) {
    try {
        const buf = await readFile(path);

        return JSON.parse(buf.toString());
    }
    catch (err) {
        return null;
    }
}

async function hydrateVulnDB() {
    const location = await download(REPO, { extract: true });
    const vulnPath = join(location, VULN_DIR_PATH);

    try {
        const jsonFiles = (await readdir(vulnPath))
            .filter((name) => extname(name) === ".json")
            .map((name) => join(vulnPath, name));

        const vulnerabilities = await Promise.all(
            jsonFiles.map((path) => readVulnJSONFile(path))
        );

        const payload = new Map();
        for (const row of vulnerabilities) {
            const packageName = row.module_name;
            if (payload.has(packageName)) {
                payload.get(packageName).push(row);
            }
            else {
                payload.set(packageName, [row]);
            }
        }

        const data = JSON.stringify(Object.fromEntries(payload));
        await writeFile(join(__dirname, "..", "vuln.json"), data);
    }
    catch (error) {
        throw error;
    }
    finally {
        await premove(location);
    }
}

module.exports = hydrateVulnDB;
