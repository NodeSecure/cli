/* eslint-disable max-len */
"use strict";

// Require Internal Dependencies
const { taggedString: tS } = require("../src/utils");

module.exports = {
    cli: {
        executing_at: "Executing node-secure at",
        min_nodejs_version: tS`node-secure require at least Node.js ${0} to work! Please upgrade your Node.js version.`,
        no_dep_to_proceed: "No dependencies to proceed !",
        successfully_written_json: tS`Successfully written .json file at: ${0}`,
        http_server_started: "HTTP Server started",
        commands: {
            option_depth: "maximum dependencies depth to fetch",
            option_output: "json file output name",
            hydrate_db: {
                desc: "Hydrate the vulnerabilities db",
                running: tS`Hydrating local vulnerabilities with the '${0}' database!`,
                success: tS`Successfully hydrated vulnerabilities database in ${0}`
            },
            cwd: {
                desc: "Run security analysis on the current working dir"
            },
            from: {
                desc: "Run security analysis on a given package from npm registry",
                searching: tS`Searching for '${0}' manifest in the npm registry!`,
                fetched: tS`Fetched ${0} manifest on npm in ${1}`
            },
            auto: {
                desc: "Run security analysis on cwd or a given package and automatically open the web interface",
                option_keep: "keep the nsecure-result.json file on the system after execution"
            },
            open: {
                desc: "Run an HTTP Server with a given nsecure JSON file."
            },
            verify: {
                desc: "Run a complete advanced analysis for a given npm package!",
                option_json: "Stdout the analysis payload"
            },
            lang: {
                desc: "Configure the CLI default language.",
                question_text: "What language do you want?",
                new_selection: tS`'${0}' has been selected as the new CLI language!`
            }
        }
    },
    depWalker: {
        fetch_and_walk_deps: "Fetching and walking through all dependencies ...",
        fetch_on_registry: "Waiting for packages to fetch on npm registry!",
        waiting_tarball: "Waiting for tarball to analyze!",
        fetch_metadata: "Fetched package metadata:",
        analyzed_tarball: "Analyzed npm tarballs:",
        success_fetch_deptree: tS`Successfully navigated through the ${0} in ${1}`,
        success_tarball: tS`Successfully analyzed ${0} packages tarball in ${1}`,
        success_registry_metadata: "Successfully fetched required metadata for all packages!",
        failed_rmdir: tS`Failed to remove directory ${0}`
    },
    ui: {
        stats: {
            title: "Global Stats",
            total_packages: "Total of packages",
            total_size: "Total size",
            indirect_deps: "Packages with indirect dependencies",
            extensions: "Extensions",
            licenses: "Licenses",
            maintainers: "Maintainers"
        },
        package_info: {
            hide_children: "Hide children",
            vuln: "Vuln",
            files_extensions: "files extensions",
            unused_deps: "unused dependencies",
            missing_deps: "missing dependencies",
            minified_files: "minified files",
            node_deps: "node.js dependencies",
            third_party_deps: "third-party dependencies",
            required_files: "required files"
        },
        btn_emojis_legends: "Emojis Legends",
        show_complete_desc: "click on a package to show a complete description here",
        loading_nodes: "... Loading nodes ...",
        please_wait: "(Please wait)"
    }
};
