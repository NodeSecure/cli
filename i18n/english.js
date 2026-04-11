/* eslint-disable @stylistic/max-len */

// Import Third-party Dependencies
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  executing_at: "Executing node-secure at",
  min_nodejs_version: tS`node-secure requires at least Node.js ${0} to work! Please upgrade your Node.js version.`,
  no_dep_to_proceed: "No dependencies to proceed!",
  successfully_written_json: tS`Successfully written results file at: ${0}`,
  http_server_started: "HTTP Server started on:",
  missingEnv: tS`Environment variable ${0} is missing!`,
  stat: tS`${0}${1} in ${2}${3}${4}`,
  tarballStats: {
    path: tS`Path: ${0}`,
    filesCount: tS`Files count: ${0}`
  },
  error: {
    name: tS`${0} name: ${1}`,
    message: tS`Message: ${0}`,
    phase: tS`The error occured during the ${0} phase`,
    statusCode: tS`HTTP Status Code: ${0}`,
    executionTime: tS`The error occured at ${0} during the execution`,
    stack: tS`Stack: ${0}`
  },
  cache: {
    found: tS`${0} found in the cache`
  },
  commands: {
    option_depth: "Maximum dependencies depth to fetch",
    option_output: "Json file output name",
    option_silent: "enable silent mode which disable CLI spinners",
    option_contacts: "List of contacts to hightlight",
    option_packages: "List of packages to highlight",
    option_verbose: "Sets cli log level to verbose, causing the CLI to output more detailed logs.",
    strategy: "Vulnerabilities source to use",
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
      option_port: "Define the running port",
      option_ws_port: "Define the WebSocket server port",
      option_fresh_start: "Launch the server from scratch, ignoring any existing payload file",
      option_developer: "Launch the server in developer mode, enabling automatic HTML component refresh"
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
    report: {
      desc: "Generate a report from a package",
      option_includesAllDeps: "Include all dependencies",
      option_theme: "Report theme ('dark', 'light')",
      option_title: "Report title",
      option_reporters: "List of reporters to use: 'html', 'pdf'"
    },
    config: {
      desc: "Edit your NodeSecure config file"
    },
    configCreate: {
      desc: "Init your Nodesecure config file",
      option_cwd: "Create config file at the cwd"
    },
    cache: {
      desc: "Manage NodeSecure cache",
      missingAction: "No valid action specified. Use --help to see options.",
      option_list: "List cache files",
      option_clear: "Clear the cache",
      cacheTitle: "NodeSecure Cache:",
      cleared: "Cache cleared successfully!"
    },
    extractIntegrity: {
      desc: "Extract the integrity of a package from its manifest and tarball and compare the two integrities if different from one another.",
      missingSpecVersion: tS`You must specify a version for '${0}' package.`,
      invalidSpec: tS`The package spec '${0}' is invalid.`,
      specNotFound: tS`The package spec '${0}' could not be found from the npm registry.`
    },
    stats: {
      desc: "Display the stats of a scan.",
      elapsed: tS`Scan duration: ${0}`,
      stats: tS`API calls count: ${0}`,
      error: "A scan must be performed before displaying stats.",
      errors: tS`Error count: ${0}`,
      option_min: "Filter API calls with execution time above the specified ceiling (in ms)",
      minNotANumber: "Error: --min must be a number.",
      statsCeiling: tS`API calls count above ${0}: ${1}`
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
      licenses: "licenses conformance (SPDX)",
      dark: "dark",
      light: "light"
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
      type: "Module type",
      lastReleaseVersion: "Last release version",
      lastReleaseDate: "Last release date",
      publishedReleases: "Number of published releases",
      numberPublishers: "Number of publisher(s)",
      weeklyDownloads: "Weekly downloads",
      weeklyTraffic: "Weekly traffic",
      downloadsAndTraffic: "Downloads and traffic"
    },
    helpers: {
      warnings: "Learn more about warnings in the",
      spdx: "Learn more about the SPDX project",
      here: "here",
      openSsf: "Learn more about the OpenSSF Scorecards",
      thirdPartyTools: "Third-party tools"
    }
  },
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
    moduleTypes: "Module Types",
    maintainers: "Maintainers",
    showMore: "show more",
    showLess: "show less"
  },
  settings: {
    general: {
      title: "General",
      save: "save",
      defaultPannel: "Default Package Menu",
      themePannel: "Interface theme",
      warnings: "SAST Warnings to ignore",
      flags: "Flags (emojis) to ignore",
      network: "Network",
      showFriendly: "Show friendly dependencies",
      security: "Security",
      disableExternalRequests: "Disable external requests"
    },
    shortcuts: {
      title: "Shortcuts",
      blockquote: "Click on hotkey to update",
      goto: "Goto",
      openCloseWiki: "Open/Close wiki",
      lock: "Lock/Unlock network",
      views: {
        home: "Home view",
        network: "Network view",
        search: "Search view",
        settings: "Settings view",
        tree: "Tree view",
        warnings: "Warnings view"
      }
    }
  },
  network: {
    childOf: "child of",
    parentOf: "parent of",
    unlocked: "unlocked",
    locked: "locked",
    switchPayload: "Switch payload",
    removeFromCache: "Remove from cache"
  },
  search: {
    packagesCache: "Packages available in the cache",
    noPackageFound: "No package found",
    packageLengthErr: "Package name must be between 2 and 64 characters.",
    registryPlaceholder: "Package name or spec (e.g. fastify@5.8.0)",
    scanning: "Scanning",
    heroTitle: "Scan a package",
    emptyHint: "Search the npm registry or enter a spec directly to scan.",
    scan: "Scan"
  },
  tree: {
    root: "Root",
    depth: "Depth",
    deps: "deps",
    direct: "direct",
    modeDepth: "Depth",
    modeTree: "Tree",
    modeActivity: "Activity",
    activityFresh: "< 1 week",
    activityRecent: "< 1 month",
    activityActive: "< 6 months",
    activityStable: "< 1 year",
    activitySlow: "< 2 years",
    activityStale: "Stale"
  },
  search_command: {
    placeholder: "Search packages...",
    placeholder_filter_hint: "or use",
    placeholder_refine: "Add another filter...",
    section_actions: "Actions",
    action_toggle_theme_to_dark: "Switch to dark theme",
    action_toggle_theme_to_light: "Switch to light theme",
    action_reset_view: "Reset view",
    action_copy_packages: "Copy packages",
    action_export_payload: "Export payload",
    section_presets: "Quick filters",
    preset_has_vulnerabilities: "Has vulnerabilities",
    preset_has_scripts: "Has install scripts",
    preset_no_license: "No license",
    preset_deprecated: "Deprecated",
    preset_large: "Large (> 100kb)",
    section_filters: "Filters",
    section_flags: "Flags - click to toggle",
    section_size: "Size - select a preset or type above",
    section_version: "Version - select a preset or type above",
    section_packages: "Packages",
    section_licenses: "Available licenses",
    section_extensions: "File extensions",
    section_builtins: "Node.js core modules",
    section_authors: "Authors",
    hint_size: "e.g. >50kb, 10kb..200kb",
    hint_version: "e.g. ^1.0.0, >=2.0.0",
    empty: "No results found",
    empty_after_filter: "No packages match the active filters",
    preset_empty_has_vulnerabilities: "No package with known vulnerabilities",
    preset_empty_has_scripts: "No package with install scripts",
    preset_empty_no_license: "All packages have a license",
    preset_empty_deprecated: "No deprecated packages",
    preset_empty_large: "No package exceeds 100kb",
    section_ignore_flags: "Ignore flags",
    section_ignore_warnings: "Ignore warnings",
    nav_navigate: "navigate",
    nav_select: "select",
    nav_remove: "remove filter",
    nav_close: "close",
    filter_hints: {
      package: "name",
      version: "semver range",
      flag: "click to select",
      license: "SPDX identifier",
      author: "name or email",
      ext: "file extension",
      builtin: "node.js module",
      size: "e.g. >50kb",
      highlighted: "all"
    }
  },
  legend: {
    default: "The package is fine.",
    warn: "The package has warnings.",
    friendly: "The package is maintained by the same authors as the root package.",
    highlighted: "The package is part of highlighted packages"
  },
  lockedNavigation: {
    next: "Next",
    prev: "Prev"
  },
  warnings: {
    title: "Warnings",
    totalWarnings: "warnings",
    totalPackages: "packages affected",
    noWarnings: "No warnings found",
    docs: "docs",
    packages: "packages",
    occurrences: "occurrences",
    critical: "Critical",
    warning: "Warning",
    information: "Information"
  }
};

export default { cli, ui };
