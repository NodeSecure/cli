/* eslint-disable max-len */
// Import Third-party Dependencies
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  executing_at: "Executing node-secure at",
  min_nodejs_version: tS`node-secure requires at least Node.js ${0} to work! Please upgrade your Node.js version.`,
  no_dep_to_proceed: "No dependencies to proceed!",
  successfully_written_json: tS`Successfully written results file at: ${0}`,
  http_server_started: "HTTP Server started on:",
  missingEnv: tS`Environment variable ${0} is missing!`,
  commands: {
    option_depth: "Maximum dependencies depth to fetch",
    option_output: "Json file output name",
    option_silent: "enable silent mode which disable CLI spinners",
    strategy: "Vulnerabilities source to use",
    hydrate_db: {
      desc: "Hydrate the vulnerabilities db",
      running: tS`Hydrating local vulnerabilities with the '${0}' database...`,
      success: tS`Successfully hydrated vulnerabilities database in ${0}`
    },
    cwd: {
      desc: "Run security analysis on the current working dir",
      option_nolock: "Disable usage of package-lock.json",
      option_full: "Enable full analysis of packages in the package-lock.json file"
    },
    from: {
      desc: "Run security analysis on a given package from npm registry",
      searching: tS`Searching for '${0}' manifest in the npm registry...`,
      fetched: tS`Fetched ${0} manifest from npm in ${1}`
    },
    auto: {
      desc: "Run security analysis on cwd or a given package and automatically open the web interface",
      option_keep: "Keep the nsecure-result.json file on the system after execution"
    },
    open: {
      desc: "Run an HTTP Server with a given nsecure JSON file",
      option_port: "Define the running port"
    },
    verify: {
      desc: "Run a complete advanced analysis for a given npm package",
      option_json: "Stdout the analysis payload"
    },
    summary: {
      desc: "Display your analysis results",
      warnings: "Warnings"
    },
    lang: {
      desc: "Configure the CLI default language",
      question_text: "What language do you want to use?",
      new_selection: tS`'${0}' has been selected as the new CLI language!`
    },
    scorecard: {
      desc: "Display the OSSF Scorecard for a given repository or the current working directory (Github only, e.g. fastify/fastify)",
      option_vcs: "Version control platform (GitHub, GitLab)"
    },
    config: {
      desc: "Edit your NodeSecure config file"
    },
    configCreate: {
      desc: "Init your Nodesecure config file",
      option_cwd: "Create config file at the cwd"
    }
  },
  startHttp: {
    invalidScannerVersion: tS`the payload has been scanned with version '${0}' and do not satisfies the required CLI range '${1}'`,
    regenerate: "please re-generate a new JSON payload using the CLI"
  }
};

const ui = {
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
    navigation: {
      overview: "overview",
      files: "files",
      dependencies: "scripts & dependencies",
      warnings: "threats in source code",
      vulnerabilities: "vulnerabilities (CVE)",
      licenses: "licenses conformance (SPDX)"
    },
    title: {
      maintainers: "maintainers",
      releases: "releases",
      files: "files",
      files_extensions: "files extensions",
      unused_deps: "unused dependencies",
      missing_deps: "missing dependencies",
      minified_files: "minified files",
      node_deps: "node.js dependencies",
      third_party_deps: "third-party dependencies",
      required_files: "required files",
      used_by: "used by",
      openSsfScorecard: "Security Scorecard"
    },
    overview: {
      homepage: "Homepage",
      author: "Author",
      size: "Size on system",
      dependencies: "Number of dependencies",
      files: "Number of files",
      tsTypings: "TS Typings",
      node: "Node.js Compatibility",
      npm: "NPM Compatibility",
      lastReleaseVersion: "Last release version",
      lastReleaseDate: "Last release date",
      publishedReleases: "Number of published releases",
      numberPublishers: "Number of publisher(s)"
    },
    helpers: {
      warnings: "Learn more about warnings in the",
      spdx: "Learn more about the SPDX project",
      here: "here",
      openSsf: "Learn more about the OpenSSF Scorecards",
      thirdPartyTools: "Third-party tools"
    }
  },
  searchbar_placeholder: "Search",
  loading_nodes: "... Loading nodes ...",
  please_wait: "(Please wait)",
  popup: {
    maintainer: {
      intree: "packages in the dependency tree"
    },
    report: {
      title: "Generate a report",
      form: {
        title: "Report title",
        includesAllDeps: "Include all dependencies",
        dark_theme: "Dark theme",
        light_theme: "Light theme",
        submit: "Generate"
      }
    }
  },
  home: {
    overview: {
      title: "Overview",
      dependencies: "dependencies",
      totalSize: "total size",
      directDeps: "direct deps",
      transitiveDeps: "transitive deps",
      downloadsLastWeek: "downloads last week",
      generateReport: "Generate a report"
    },
    watch: "Packages in the dependency tree requiring greater attention",
    criticalWarnings: "Critical Warnings",
    maintainers: "Maintainers",
    showMore: "show more",
    showLess: "show less"
  },
  settings: {
    general: {
      title: "General",
      save: "save",
      defaultPannel: "Default Package Menu",
      warnings: "SAST Warnings to ignore",
      flags: "Flags (emojis) to ignore"
    },
    shortcuts: {
      title: "Shortcuts",
      blockquote: "Click on hotkey to update",
      goto: "Goto",
      openCloseWiki: "Open/Close wiki",
      lock: "Lock/Unlock network"
    }
  },
  network: {
    childOf: "child of",
    parentOf: "parent of",
    unlocked: "unlocked",
    locked: "locked"
  },
  search: {
    "File extensions": "File extensions",
    "Node.js core modules": "Node.js core modules",
    "Available licenses": "Available licenses",
    "Available flags": "Available flags",
    default: "Search options"
  }
};

export default { cli, ui };
