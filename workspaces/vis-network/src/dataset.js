// Import Third-party Dependencies
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
   */
  constructor(options = {}) {
    super();
    const { flagsToIgnore = [], warningsToIgnore = [] } = options;

    this.flagsToIgnore = new Set(flagsToIgnore);
    this.warningsToIgnore = new Set(warningsToIgnore);
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

  get prettySize() {
    return prettyBytes(this.size);
  }

  async init(initialPayload = null, initialFlags = {}) {
    console.log("[NodeSecureDataSet] Initialization started...");
    let FLAGS; let data;

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
    this.warnings = data.warnings;
    this.data = data;

    const dataEntries = Object.entries(data.dependencies);
    this.dependenciesCount = dataEntries.length;

    for (const [packageName, descriptor] of dataEntries) {
      for (const [currVersion, opt] of Object.entries(descriptor.versions)) {
        const { id, usedBy, flags, size, license, author, composition, warnings } = opt;

        const filteredWarnings = warnings
          .filter((row) => !this.warningsToIgnore.has(row.kind));
        const hasWarnings = filteredWarnings.length > 0;

        opt.name = packageName;
        opt.version = currVersion;
        opt.hidden = false;
        opt.hasWarnings = hasWarnings;

        this.computeExtension(composition.extensions);
        this.computeLicense(license);
        this.computeAuthor(author);

        if (flags.includes("hasIndirectDependencies")) {
          this.indirectDependencies++;
        }
        this.size += size;

        const flagStr = utils.getFlagsEmojisInlined(
          flags,
          hasWarnings ? this.flagsToIgnore : new Set([...this.flagsToIgnore, "hasWarnings"])
        );
        this.packages.push({
          id,
          name: packageName,
          version: currVersion,
          hasWarnings,
          flags: flagStr.replace(/\s/g, "")
        });

        const label = `<b>${packageName}@${currVersion}</b>${flagStr}\n<b>[${prettyBytes(size)}]</b>`;
        const color = utils.getNodeColor(id, hasWarnings);
        color.font.multi = "html";

        this.linker.set(Number(id), opt);
        this.rawNodesData.push(Object.assign({ id, label }, color));

        for (const [name, version] of Object.entries(usedBy)) {
          this.rawEdgesData.push({ from: id, to: data.dependencies[name].versions[version].id });
        }
      }
    }
    console.log("[NodeSecureDataSet] Initialization done!");
  }

  computeExtension(extensions) {
    for (const extName of extensions) {
      if (extName !== "") {
        this.extensions[extName] = Reflect.has(this.extensions, extName) ? ++this.extensions[extName] : 1;
      }
    }
  }

  computeLicense(license) {
    if (typeof license === "string") {
      this.licenses.Unknown++;
    }
    else {
      for (const licenseName of license.uniqueLicenseIds) {
        this.licenses[licenseName] = Reflect.has(this.licenses, licenseName) ? ++this.licenses[licenseName] : 1;
      }
    }
  }

  computeAuthor(author) {
    const user = "name" in author ? author : { name: null };

    if (this.authors.has(user.name)) {
      this.authors.get(user.name).count++;
    }
    else if (user.name !== null) {
      this.authors.set(user.name, Object.assign({}, user, { count: 1 }));
    }
  }

  build() {
    const nodes = new DataSet(this.rawNodesData);
    const edges = new DataSet(this.rawEdgesData);

    return { nodes, edges };
  }
}
