// Import Third-party Dependencies
import { Extractors } from "@nodesecure/scanner/extractors";
import prettyBytes from "pretty-bytes";
import { DataSet } from "vis-data";

// Import Internal Dependencies
import * as utils from "./utils.js";

export default class NodeSecureDataSet extends EventTarget {
  /**
   *
   * @param {object} [options]
   * @param {string[]} [options.flagsToIgnore=[]]
   * @param {string[]} [options.warningsToIgnore=[]]
   * @param {"light"|"dark"} [options.theme]
   */

  #highligthedContacts;

  constructor(options = {}) {
    super();
    const {
      flagsToIgnore = [],
      warningsToIgnore = [],
      theme = "light"
    } = options;
    this.flagsToIgnore = new Set(flagsToIgnore);
    this.warningsToIgnore = new Set(warningsToIgnore);
    this.theme = theme;
    this.reset();
  }

  get prettySize() {
    return prettyBytes(this.size);
  }

  reset() {
    this.warnings = [];
    this.packages = [];
    this.linker = new Map();
    this.authors = new Map();
    this.extensions = Object.create(null);
    this.licenses = { Unknown: 0 };

    this.rawNodesData = [];
    this.rawEdgesData = [];

    this.data = {};
    this.dependenciesCount = 0;
    this.size = 0;
    this.indirectDependencies = 0;
  }

  async init(
    initialPayload = null,
    initialFlags = {}
  ) {
    console.log("[NodeSecureDataSet] Initialization started...");
    let FLAGS;
    /** @type {import("@nodesecure/scanner").Payload | null} */
    let data;
    this.reset();

    if (initialPayload) {
      data = initialPayload;
      FLAGS = initialFlags;
    }
    else {
      ([data, FLAGS] = await Promise.all([
        utils.getJSON("/data"), utils.getJSON("/flags")
      ]));
    }

    this.FLAGS = FLAGS;
    this.data = data;

    if (data === null) {
      return;
    }

    this.warnings = data.warnings.map(
      (warning) => (typeof warning === "string" ? warning : warning.message)
    );

    this.#highligthedContacts = data.highlighted.contacts
      .reduce((acc, { name, email }) => {
        if (name) {
          acc.names.add(name);
        }
        if (email) {
          acc.emails.add(email);
        }

        return acc;
      }, { names: new Set(), emails: new Set() });

    const dependencies = Object.entries(data.dependencies);
    this.dependenciesCount = dependencies.length;

    this.rawEdgesData = [];
    this.rawNodesData = [];

    const rootDependency = dependencies.find(([name]) => name === data.rootDependency.name);
    this.rootContributors = [
      rootDependency[1].metadata.author,
      ...rootDependency[1].metadata.maintainers,
      ...rootDependency[1].metadata.publishers
    ];

    const extractor = new Extractors.Payload(data, [
      new Extractors.Probes.Licenses(),
      new Extractors.Probes.Extensions()
    ]);

    extractor.on("manifest", (currVersion, opt, { name, dependency }) => {
      const contributors = [dependency.metadata.author, ...dependency.metadata.maintainers, ...dependency.metadata.publishers];
      const packageName = name;
      const { id, usedBy, flags, size, author, warnings, links } = opt;
      const filteredWarnings = warnings
        .filter((row) => !this.warningsToIgnore.has(row.kind));
      const hasWarnings = filteredWarnings.length > 0;

      opt.name = packageName;
      opt.version = currVersion;
      opt.hidden = false;
      opt.hasWarnings = hasWarnings;

      this.computeAuthor(author, `${packageName}@${currVersion}`, contributors);

      if (flags.includes("hasIndirectDependencies")) {
        this.indirectDependencies++;
      }
      this.size += size;

      const flagStr = utils.getFlagsEmojisInlined(
        flags,
        hasWarnings ? this.flagsToIgnore : new Set([...this.flagsToIgnore, "hasWarnings"])
      );
      const isFriendly = window.settings.config.showFriendlyDependencies & this.rootContributors.some(
        (rootContributor) => contributors.some((contributor) => {
          if (contributor === null || rootContributor === null) {
            return false;
          }
          else if (contributor.email && contributor.email === rootContributor.email) {
            return true;
          }
          else if (contributor.name && contributor.name === rootContributor.name) {
            return true;
          }

          return false;
        })
      );
      opt.isFriendly = isFriendly;

      this.packages.push({
        id,
        name: packageName,
        version: currVersion,
        hasWarnings,
        flags: flagStr.replace(/\s/g, ""),
        links,
        isFriendly
      });

      const label = `<b>${packageName}@${currVersion}</b>${flagStr}\n<b>[${prettyBytes(size)}]</b>`;
      const color = utils.getNodeColor({
        id,
        hasWarnings,
        isFriendly,
        theme: this.theme.toUpperCase()
      });
      color.font.multi = "html";

      this.linker.set(Number(id), opt);
      this.rawNodesData.push(Object.assign({ id, label }, color));

      for (const [name, version] of Object.entries(usedBy)) {
        this.rawEdgesData.push({ from: id, to: this.data.dependencies[name].versions[version].id });
      }
    });

    const { extensions, licenses } = extractor.extractAndMerge();

    this.extensions = extensions;
    this.licenses = licenses;

    console.log("[NodeSecureDataSet] Initialization done!");
  }

  getAuthorByEmail(emailToMatch) {
    for (const [name, data] of this.authors.entries()) {
      if (data.email === emailToMatch) {
        return [name, data];
      }
    }

    return null;
  }

  computeAuthor(author, spec, contributors = []) {
    if (author === null) {
      return;
    }
    const contributor = contributors.find((contributor) => contributor.email === author.email && contributor.npmAvatar !== null);

    if (this.authors.has(author.name)) {
      this.authors.get(author.name).packages.add(spec);
    }
    else {
      this.authors.set(
        author.name,
        Object.assign({}, author, { packages: new Set([spec]) })
      );
    }
    if (contributor && contributor.npmAvatar) {
      this.authors.get(author.name).npmAvatar = contributor.npmAvatar;
    }
  }

  build() {
    const nodes = new DataSet(this.rawNodesData);
    const edges = new DataSet(this.rawEdgesData);

    return { nodes, edges };
  }

  isHighlighted(contact) {
    return this.#highligthedContacts.names.has(contact.name) || this.#highligthedContacts.emails.has(contact.email);
  }

  findPackagesByName(name) {
    return this.packages.filter((pkg) => pkg.name === name);
  }
}
