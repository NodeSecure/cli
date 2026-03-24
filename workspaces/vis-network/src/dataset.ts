// Import Third-party Dependencies
import { Extractors } from "@nodesecure/scanner/extractors";
import prettyBytes from "pretty-bytes";
import { DataSet } from "vis-data";
import type {
  DependencyVersion,
  Maintainer,
  Publisher,
  DependencyLinks,
  GlobalWarning,
  Payload
} from "@nodesecure/scanner";

// Import Internal Dependencies
import * as utils from "./utils.ts";

declare global {
  interface Window {
    settings: {
      config: {
        showFriendlyDependencies: boolean;
      };
    };
  }
}

interface DataSetOptions {
  flagsToIgnore?: string[];
  warningsToIgnore?: string[];
  theme?: string;
}

interface HighlightedContacts {
  names: Set<string>;
  emails: Set<string>;
}

export type Contributor = Maintainer | Publisher | null;

export type LinkerEntry = DependencyVersion & {
  name: string;
  version: string;
  hidden: boolean;
  hasWarnings: boolean;
  isFriendly: boolean;
};

export interface PackageInfo {
  id: number | undefined;
  name: string;
  version: string;
  hasWarnings: boolean;
  flags: string;
  links: DependencyLinks | undefined;
  isFriendly: boolean;
}

export type AuthorInfo = Maintainer & {
  packages: Set<string>;
};

export interface VisNode {
  id: number;
  label: string;
  color: string;
  font: {
    color: string;
    background?: string;
    multi: string;
  };
  hidden?: boolean;
}

export interface VisEdge {
  id?: string | number;
  from: number;
  to: number;
  label?: string;
  font?: {
    background: string;
  };
}

export default class NodeSecureDataSet extends EventTarget {
  #highligthedContacts!: HighlightedContacts;

  flagsToIgnore: Set<string>;
  warningsToIgnore: Set<string>;
  theme: string;
  warnings: string[];
  packages: PackageInfo[];
  linker: Map<number, LinkerEntry>;
  authors: Map<string, AuthorInfo>;
  extensions: Record<string, number>;
  licenses: Record<string, number>;
  rawNodesData: VisNode[];
  rawEdgesData: VisEdge[];
  data: Payload | null;
  dependenciesCount: number;
  size: number;
  indirectDependencies: number;
  FLAGS: unknown;
  rootContributors: Contributor[];

  constructor(
    options: DataSetOptions = {}
  ) {
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

  get prettySize(): string {
    return prettyBytes(this.size);
  }

  reset(): void {
    this.warnings = [];
    this.packages = [];
    this.linker = new Map();
    this.authors = new Map();
    this.extensions = Object.create(null);
    this.licenses = { Unknown: 0 };

    this.rawNodesData = [];
    this.rawEdgesData = [];

    this.data = null;
    this.dependenciesCount = 0;
    this.size = 0;
    this.indirectDependencies = 0;
    this.rootContributors = [];
  }

  async init(
    initialPayload: Payload | null = null,
    initialFlags: unknown = {}
  ): Promise<void> {
    console.log("[NodeSecureDataSet] Initialization started...");
    let FLAGS: unknown;
    let data: Payload | null;
    this.reset();

    if (initialPayload) {
      data = initialPayload;
      FLAGS = initialFlags;
    }
    else {
      ([data, FLAGS] = await Promise.all([
        utils.getJSON("/data"),
        utils.getJSON("/flags")
      ]) as [Payload | null, unknown]);
    }

    this.FLAGS = FLAGS;
    this.data = data;

    if (data === null || data === undefined) {
      return;
    }

    this.warnings = data.warnings.map(
      (warning: GlobalWarning) => (typeof warning === "string" ? warning : warning.message)
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
      }, { names: new Set<string>(), emails: new Set<string>() });

    const dependencies = Object.entries(data.dependencies);
    this.dependenciesCount = dependencies.length;

    this.rawEdgesData = [];
    this.rawNodesData = [];

    const rootDependency = dependencies.find(([name]) => name === data!.rootDependency.name)!;
    this.rootContributors = [
      rootDependency[1].metadata.author,
      ...rootDependency[1].metadata.maintainers,
      ...rootDependency[1].metadata.publishers
    ];

    const extractor = new Extractors.Payload(data, [
      new Extractors.Probes.Licenses(),
      new Extractors.Probes.Extensions()
    ]);

    extractor.on("error", (err) => {
      console.error("[NodeSecureDataSet] Error during extraction:", err);
    });

    extractor.on("manifest", (currVersion, opt, { name, dependency }) => {
      const contributors: Contributor[] = [
        dependency.metadata.author,
        ...dependency.metadata.maintainers,
        ...dependency.metadata.publishers
      ];
      const packageName = name;
      const { id, usedBy, flags, size, author, warnings, links } = opt;
      const filteredWarnings = warnings
        .filter((row) => !this.warningsToIgnore.has(row.kind));
      const hasWarnings = filteredWarnings.length > 0;

      this.computeAuthor(author, `${packageName}@${currVersion}`, contributors);

      if (flags.includes("hasIndirectDependencies")) {
        this.indirectDependencies++;
      }
      this.size += size;

      const flagStr = utils.getFlagsEmojisInlined(
        flags,
        hasWarnings ? this.flagsToIgnore : new Set([...this.flagsToIgnore, "hasWarnings"])
      );
      const isFriendly = window.settings?.config?.showFriendlyDependencies && this.rootContributors.some(
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

      const linkerEntry: LinkerEntry = {
        ...opt,
        name: packageName,
        version: currVersion,
        hidden: false,
        hasWarnings,
        isFriendly
      };
      this.linker.set(Number(id), linkerEntry);
      this.rawNodesData.push({
        id,
        label,
        color: color.color,
        font: { ...color.font, multi: "html" }
      });

      for (const [depName, depVersion] of Object.entries(usedBy)) {
        this.rawEdgesData.push({
          from: id,
          to: data!.dependencies[depName].versions[depVersion].id
        });
      }
    });

    const { extensions, licenses } = extractor.extractAndMerge();

    this.extensions = extensions;
    this.licenses = licenses;

    console.log("[NodeSecureDataSet] Initialization done!");
  }

  getAuthorByEmail(
    emailToMatch: string
  ): [string, AuthorInfo] | null {
    for (const [name, data] of this.authors.entries()) {
      if (data.email === emailToMatch) {
        return [name, data];
      }
    }

    return null;
  }

  computeAuthor(
    author: Maintainer | null,
    spec: string,
    contributors: Contributor[] = []
  ): void {
    if (author === null) {
      return;
    }
    const contributor = contributors.find(
      (c) => c !== null && c.email === author.email && c.npmAvatar !== undefined
    );

    if (this.authors.has(author.name)) {
      this.authors.get(author.name)!.packages.add(spec);
    }
    else {
      this.authors.set(
        author.name,
        Object.assign({}, author, { packages: new Set([spec]) })
      );
    }
    if (contributor && contributor.npmAvatar) {
      this.authors.get(author.name)!.npmAvatar = contributor.npmAvatar;
    }
  }

  build(): { nodes: DataSet<VisNode>; edges: DataSet<VisEdge>; } {
    const nodes = new DataSet(this.rawNodesData);
    const edges = new DataSet(this.rawEdgesData);

    return { nodes, edges };
  }

  isHighlighted(
    contact: { name?: string; email?: string; }
  ): boolean {
    return this.#highligthedContacts.names.has(contact.name ?? "") ||
      this.#highligthedContacts.emails.has(contact.email ?? "");
  }

  findPackagesByName(
    name: string
  ): PackageInfo[] {
    return this.packages.filter((pkg) => pkg.name === name);
  }
}
