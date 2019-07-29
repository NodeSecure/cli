"use strict";

// Require Node.js Dependencies
const { join, extname } = require("path");
const { readdir, readFile } = require("fs").promises;

// Require Third-party Dependencies
const download = require("@slimio/github");
const sqlite = require("better-sqlite3");
const premove = require("premove");

// CONSTANTS
const REPO = "nodejs.security-wg";
const VULN_DIR_PATH = join("vuln", "npm");
const FIELDS = [
    "id", "created_at", "updated_at", "title", "package", "publish_date",
    "author", "vulnerable_versions", "patched_versions", "overview",
    "recommendation", "cvss_vector", "cvss_score", "cves", "coordinating_vendor"
];

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
    const db = sqlite("vuln.db");
    db.exec(await readFile(join(__dirname, "vuln.sql"), "utf-8"));

    const location = await download(REPO, { extract: true });
    const vulnPath = join(location, VULN_DIR_PATH);

    try {
        const jsonFiles = (await readdir(vulnPath))
            .filter((name) => extname(name) === ".json")
            .map((name) => join(vulnPath, name));

        const vulnerabilities = await Promise.all(
            jsonFiles.map((path) => readVulnJSONFile(path))
        );

        const insert = db.prepare(`INSERT INTO db (${FIELDS.join(",")}) VALUES (${FIELDS.map((str) => `@${str}`).join(",")})`);
        const insertMany = db.transaction((vuln) => {
            vuln.forEach((row) => insert.run(row));
        });
        insertMany(vulnerabilities.map((row) => {
            return {
                id: row.id,
                created_at: row.created_at,
                updated_at: row.updated_at,
                title: row.title,
                package: row.module_name,
                publish_date: row.publish_date,
                author: Reflect.has(row, "author") ? row.author.name : "N/A",
                vulnerable_versions: row.vulnerable_versions,
                patched_versions: row.patched_versions,
                overview: row.overview,
                recommendation: row.recommendation,
                cvss_vector: row.cvss_vector,
                cvss_score: row.cvss_score,
                cves: row.cves.join(","),
                coordinating_vendor: row.coordinating_vendor
            };
        }));
    }
    finally {
        db.close();
        await premove(location);
    }
}

module.exports = hydrateVulnDB;
