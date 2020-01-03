"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const {
    unlinkSync,
    promises: { readdir, readFile, writeFile, rmdir }
} = require("fs");

// Require Third-party Dependencies
const download = require("@slimio/github");
const semver = require("semver");

// CONSTANTS
const REPO = "nodejs.security-wg";
const VULN_DIR_PATH = join("vuln", "npm");
const VULN_FILE_PATH = join(__dirname, "..", "vuln.json");

async function readVulnJSONFile(path) {
    try {
        const buf = await readFile(path);

        return JSON.parse(buf.toString());
    }
    catch (err) {
        return null;
    }
}

async function hydrateDB() {
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
        await writeFile(VULN_FILE_PATH, data);
    }
    catch (error) {
        throw error;
    }
    finally {
        await rmdir(location, { recursive: true });
    }
}

async function hydrateNodeSecurePayload(flattenedDeps) {
    try {
        const buf = await readFile(VULN_FILE_PATH);
        const vulnerabilities = JSON.parse(buf.toString());

        const currThreeNames = new Set([...flattenedDeps.keys()]);
        const filtered = new Set(
            Object.keys(vulnerabilities).filter((name) => currThreeNames.has(name))
        );

        for (const name of filtered) {
            const dep = flattenedDeps.get(name);
            const detectedVulnerabilities = [];
            for (const currVuln of vulnerabilities[name]) {
                // eslint-disable-next-line no-loop-func
                const satisfied = dep.versions.some((version) => semver.satisfies(version, currVuln.vulnerable_versions));
                if (satisfied) {
                    detectedVulnerabilities.push(currVuln);
                }
            }

            if (detectedVulnerabilities.length > 0) {
                dep.vulnerabilities = detectedVulnerabilities;
            }
        }
    }
    catch (err) {
        console.log(err);
        // Ignore
    }
}

function deleteDB() {
    try {
        unlinkSync(VULN_FILE_PATH);
    }
    catch (err) {
        // ignore
    }
}

module.exports = {
    deleteDB,
    hydrateDB,
    hydrateNodeSecurePayload
};
