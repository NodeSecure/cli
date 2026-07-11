// Import Third-party Dependencies
import { NodeSecureDataSet, getFlagsEmojisInlined, getJSON } from "@nodesecure/vis-network";
import { licenseIdConformance } from "@nodesecure/licenses-conformance";
import { getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";

// Import Internal Dependencies
import * as utils from "../../../common/utils.js";
import "../../gauge/gauge.js";
import "../../expandable/expandable.js";
import { EVENTS } from "../../../core/events.js";
import { PackageInfo } from "../../package/package.js";
import {
  fetchScorecardData,
  getScorecardLink
} from "../../../common/scorecard.js";

// Import Components
import "./maintainers/maintainers.js";
import "./report/report.js";

// CONSTANTS
const kFlagsToWatch = new Set([
  "hasBannedFile",
  "isDeprecated",
  "hasVulnerabilities",
  "hasScript"
]);

const kEmojiMetadata = {
  "📦": {
    description: "scripts",
    menu: {
      name: "dependencies",
      priority: 3
    }
  },
  "⚔️": {
    description: "sensitive files",
    menu: {
      name: "files",
      priority: 1
    }
  },
  "🚨": {
    description: "vulnerabilities",
    menu: {
      name: "vulnerabilities",
      priority: 2
    }
  },
  "⛔️": {
    description: "deprecated",
    menu: {
      name: "info",
      priority: 0
    }
  }
};

export class HomeView {
  /**
   * @param {!NodeSecureDataSet} secureDataSet
   * @param {import("@nodesecure/vis-network").NodeSecureNetwork} nsn
   */
  constructor(
    secureDataSet,
    nsn
  ) {
    this.secureDataSet = secureDataSet;
    this.nsn = nsn;
    this.lang = utils.currentLang();

    const homeViewHTMLElement = /** @type {HTMLElement} */ (document.getElementById("home--view"));
    homeViewHTMLElement.innerHTML = "";
    homeViewHTMLElement.appendChild(this.render());

    if (utils.getSettingsConfig().disableExternalRequests === false) {
      this.generateScorecard();
    }
    this.generateHeader();
    this.generateOverview();
    this.generatePackagesToWatch();
    this.generateWarnings();
    this.generateExtensions();
    this.generateLicenses();
    this.generateMaintainers();
    this.generateModuleTypes();
    this.handleReport();
  }

  render() {
    console.log("[HOME] cloning new template");
    const template = /** @type {HTMLTemplateElement | null} */ (document.getElementById("home-view-content"));
    if (!template) {
      throw new Error("Unable to find HTML template with ID 'home-view-content'");
    }

    const clone = document.importNode(template.content, true);

    return clone;
  }

  generateScorecard() {
    const rootEntry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (this.secureDataSet.linker.get(0));
    const { name, version } = rootEntry;
    const pkg = /** @type {NonNullable<NodeSecureDataSet["data"]>} */ (this.secureDataSet.data).dependencies[name];
    const { repository } = pkg.versions[version].links ?? {};

    if (repository === null || repository === undefined) {
      return;
    }

    const [repoNameRaw, platformRaw] = getVCSRepositoryPathAndPlatform(repository) ?? [];
    const repoName = /** @type {string} */ (repoNameRaw);
    const platform = /** @type {string} */ (platformRaw);

    fetchScorecardData(repoName, platform).then((data) => {
      if (data !== null) {
        /** @type {HTMLElement} */ (document
          .querySelector(".home--header--scorecard .score"))
          .classList.add(getScoreColor(data.score));
        /** @type {HTMLElement} */ (document.getElementById("home-scorecard-score")).innerHTML = String(data.score);
        const scorescardElement = /** @type {HTMLElement} */ (document.querySelector(".home--header--scorecard"));
        scorescardElement.addEventListener("click", () => {
          window.open(getScorecardLink(repoName, platform), "_blank");
        });
        scorescardElement.style.display = "flex";
      }
    });
  }

  generateHeader() {
    const rootEntry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (this.secureDataSet.linker.get(0));
    const { name, version, description, repository } = rootEntry;

    /** @type {HTMLElement} */ (document.getElementById("project-name")).textContent = name;
    /** @type {HTMLElement} */ (document.getElementById("project-version")).textContent = version;
    /** @type {HTMLElement} */ (document.getElementById("project-description")).textContent = description;

    const linksFragment = document.createDocumentFragment();
    const links = {
      NPM: {
        src: "npm-icon.svg",
        href: `https://www.npmjs.com/package/${name}/v/${version}`
      },
      Github: {
        src: "github-black.png",
        href: utils.parseRepositoryUrl(/** @type {{ url?: string } | undefined} */ (repository))
      }
    };

    for (const [linkName, config] of Object.entries(links)) {
      const liElement = utils.createDOMElement("li", {
        childs: [
          utils.createDOMElement("img", { attributes: { src: config.src } }),
          utils.createDOMElement("p", { text: linkName })
        ]
      });
      if (config.href === null) {
        liElement.style.display = "none";
      }
      else {
        const href = config.href;
        liElement.addEventListener("click", () => window.open(href, "_blank"));
      }

      linksFragment.appendChild(liElement);
    }

    /** @type {HTMLElement} */ (document.getElementById("project-links")).appendChild(linksFragment);
  }

  /**
   * @param {string} icon
   * @param {string} title
   * @param {string | number} value
   */
  #createOverviewDiv(icon, title, value) {
    const titleDiv = utils.createDOMElement("div", {
      className: "title",
      childs: [
        utils.createDOMElement("i", { className: icon }),
        utils.createDOMElement("p", { text: title })
      ]
    });

    return utils.createDOMElement("div", {
      childs: [
        titleDiv,
        utils.createDOMElement("span", { text: String(value) })
      ]
    });
  }

  async generateOverview() {
    const fragment = document.createDocumentFragment();
    const overview = /** @type {Record<string, string>} */ (
      /** @type {unknown} */ (utils.getI18n(this.lang).home.overview)
    );

    const rootEntry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (this.secureDataSet.linker.get(0));
    const { name } = rootEntry;
    let directDependencies = 0;
    for (const { usedBy } of this.secureDataSet.linker.values()) {
      if (name in usedBy) {
        directDependencies++;
      }
    }
    fragment.appendChild(this.#createOverviewDiv(
      "icon-cubes", `# ${overview.dependencies}`, this.secureDataSet.dependenciesCount
    ));
    fragment.appendChild(this.#createOverviewDiv(
      "icon-archive", overview.totalSize, this.secureDataSet.prettySize
    ));
    fragment.appendChild(this.#createOverviewDiv(
      "icon-link", `# ${overview.directDeps}`, directDependencies
    ));
    fragment.appendChild(this.#createOverviewDiv(
      "icon-sitemap", `# ${overview.transitiveDeps}`, this.secureDataSet.indirectDependencies
    ));

    const homeOverviewElement = /** @type {HTMLElement} */ (document.querySelector(".home--overview"));
    homeOverviewElement.appendChild(fragment);

    if (utils.getSettingsConfig().disableExternalRequests) {
      return;
    }

    this.generateDownloads();
  }

  generatePackagesToWatch() {
    const maxPackages = 4;
    const fragment = document.createDocumentFragment();

    /** @type {{ name: string, version: string, flags: string[], deprecated?: string }[]} */
    const deps = [];

    const nodeSecureDataSetData = /** @type {NonNullable<NodeSecureDataSet["data"]>} */ (this.secureDataSet.data);
    for (const [name, dependency] of Object.entries(nodeSecureDataSetData.dependencies)) {
      for (const [version, dependencyVer] of Object.entries(dependency.versions)) {
        const { flags } = dependencyVer;

        const hasFlag = flags.some((name) => kFlagsToWatch.has(name));
        if (hasFlag) {
          deps.push({
            name,
            version,
            flags,
            deprecated: dependencyVer.deprecated
          });
        }
      }
    }

    const hideItems = deps.length > maxPackages;
    for (let id = 0; id < deps.length; id++) {
      const dependency = deps[id];

      const [element, menuToOpen] = this.renderPackage(dependency);
      element.addEventListener("click", () => {
        utils.getNavigation().setNavByName("network--view");
        setTimeout(() => {
          PackageInfo.ForcedPackageMenu = menuToOpen;
          this.nsn.focusNodeByNameAndVersion(
            dependency.name,
            dependency.version
          );
        }, 25);
      });
      if (hideItems && id >= maxPackages) {
        element.classList.add("hidden");
      }

      fragment.appendChild(element);
    }

    if (fragment.children.length === 0) {
      /** @type {HTMLElement} */ (document.getElementById("homewatch")).style.display = "none";
    }
    else {
      if (hideItems) {
        const expandableSpan = document.createElement("expandable-span");
        expandableSpan.onToggle = () => utils.toggle(expandableSpan,
          /** @type {HTMLElement} */ (document.querySelector(".home--packages--overview")),
          maxPackages);
        fragment.appendChild(expandableSpan);
      }

      /** @type {HTMLElement} */ (document.querySelector(".home--packages--overview"))
        .appendChild(fragment);
    }
  }

  /**
   * @param {{ name: string, version: string, flags: string[], deprecated?: string }} dependencyVer
   * @returns {[HTMLElement, string]}
   */
  renderPackage(dependencyVer) {
    const { name, version, flags, deprecated } = dependencyVer;

    const menuToOpen = {
      name: "info",
      priority: 0
    };
    const inlinedEmojis = getFlagsEmojisInlined(
      flags.filter((name) => kFlagsToWatch.has(name)),
      new Set(utils.getSettingsConfig().ignore.flags)
    );

    /** @type {HTMLElement[]} */
    const childs = [];
    for (const emoji of utils.extractEmojis(inlinedEmojis)) {
      const {
        menu,
        description
      } = /** @type {Record<string, { menu: { name: string, priority: number }, description: string }>} */ (
        kEmojiMetadata
      )[emoji];
      if (menu.priority > menuToOpen.priority) {
        menuToOpen.name = menu.name;
        menuToOpen.priority = menu.priority;
      }

      childs.push(
        utils.createDOMElement("p", {
          text: `${emoji} ${description}`
        })
      );
    }

    const packageContents = [
      utils.createDOMElement("div", {
        className: "home--package--header",
        childs: [
          utils.createDOMElement("p", {
            childs: [
              document.createTextNode(name),
              utils.createDOMElement("span", { text: `v${version}` })
            ]
          }),
          utils.createDOMElement("div", {
            className: "chips",
            childs
          })]
      })
    ];

    if (deprecated) {
      packageContents.push(utils.createDOMElement("p", { text: deprecated }));
    }

    return [
      utils.createDOMElement("div", {
        childs: packageContents
      }),
      menuToOpen.name
    ];
  }

  generateWarnings() {
    const warningsModuleElement = /** @type {HTMLElement} */ (document.getElementById("warnings-module"));
    if (this.secureDataSet.warnings.length === 0) {
      warningsModuleElement.style.display = "none";

      return;
    }

    const fragment = document.createDocumentFragment();
    for (const text of this.secureDataSet.warnings) {
      fragment.appendChild(utils.createDOMElement("p", { text }));
    }

    /** @type {HTMLElement} */ (warningsModuleElement.querySelector(".count")).textContent = String(
      this.secureDataSet.warnings.length
    );
    /** @type {HTMLElement} */ (warningsModuleElement.querySelector(".home--warnings")).appendChild(fragment);
  }

  generateExtensions() {
    const extensions = [...Object.entries(this.secureDataSet.extensions)]
      .sort(([, left], [, right]) => right - left)
      .map(([name, value]) => {
        return { name, value };
      });

    const gauge = document.createElement("gauge-bar");
    gauge.data = extensions;
    gauge.theme = this.secureDataSet.theme;

    /** @type {HTMLElement} */ (document.getElementById("home-extensions")).appendChild(gauge);
  }

  generateLicenses() {
    const licenses = [...Object.entries(this.secureDataSet.licenses)]
      .sort(([, left], [, right]) => right - left)
      .flatMap(([name, value]) => {
        const result = licenseIdConformance(name);
        if (!result.ok) {
          return [];
        }

        return [
          {
            name,
            value,
            link: result.value.spdxLicenseLinks?.[0] ?? null,
            chips: Object.entries(/** @type {Record<string, boolean>} */ (result.value.spdx))
              .filter(([key]) => key !== "includesDeprecated")
              .map(([key, value]) => `${value ? "✔️" : "❌"} ${key}`)
          }
        ];
      });

    const gauge = document.createElement("gauge-bar");
    gauge.data = licenses;
    gauge.theme = this.secureDataSet.theme;

    /** @type {HTMLElement} */ (document.getElementById("home-licenses")).appendChild(gauge);
  }

  generateMaintainers() {
    const maintainers = document.createElement("nsecure-maintainers");
    maintainers.secureDataSet = this.secureDataSet;
    maintainers.nsn = this.nsn;
    maintainers.theme = this.secureDataSet.theme;
    maintainers.options = {
      maximumMaintainers: 5
    };
    const pannel = /** @type {HTMLElement} */ (document.getElementById("pannel-right"));
    pannel.prepend(maintainers);
  }

  generateModuleTypes() {
    const moduleTypesElement = /** @type {HTMLElement} */ (document.getElementById("home-modules-types"));
    const moduleTypes = Object.values(/** @type {NonNullable<NodeSecureDataSet["data"]>} */ (
      this.secureDataSet.data
    ).dependencies).reduce((acc, dep) => {
      const types = Object.values(dep.versions).map((version) => version.type);
      for (const type of types) {
        acc[type] += 1;
      }

      return acc;
    }, {
      esm: 0,
      cjs: 0,
      dual: 0,
      dts: 0,
      faux: 0
    });
    const moduleTypesJaugeData = [...Object.entries(moduleTypes)]
      .sort(([, left], [, right]) => right - left)
      .map(([name, value]) => {
        return { name, value };
      });

    const gauge = document.createElement("gauge-bar");
    gauge.data = moduleTypesJaugeData;
    gauge.theme = this.secureDataSet.theme;

    moduleTypesElement.appendChild(gauge);
  }

  async generateDownloads() {
    const homeOverviewElement = /** @type {HTMLElement} */ (document.querySelector(".home--overview"));
    const rootEntry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (this.secureDataSet.linker.get(0));
    const { name } = rootEntry;

    try {
      const { downloads } = /** @type {{ downloads: number }} */ (await getJSON(`/downloads/${name.replaceAll("/", "%2F")}`));

      if (downloads) {
        const downloadsElement = document.querySelector(".home--overview div:has(i.icon-chart-bar)");
        downloadsElement?.remove();
        const formattedNumber = new Intl.NumberFormat("de-DE").format(downloads);
        const overview = /** @type {Record<string, string>} */ (
          /** @type {unknown} */ (utils.getI18n(this.lang).home.overview)
        );
        homeOverviewElement.appendChild(this.#createOverviewDiv(
          "icon-chart-bar",
          overview.downloadsLastWeek,
          formattedNumber
        ));
      }
    }
    catch {
      // DO NOTHING
    }
  }

  handleReport() {
    /** @type {HTMLElement} */ (document.querySelector(".home--header--report")).addEventListener("click", async() => {
      const popupReport = document.createElement("popup-report");
      popupReport.dependencyName = /** @type {NonNullable<NodeSecureDataSet["data"]>} */ (
        this.secureDataSet.data
      ).rootDependency.name;
      popupReport.theme = this.secureDataSet.theme;
      window.dispatchEvent(new CustomEvent(EVENTS.MODAL_OPENED, {
        detail: {
          content: popupReport
        }
      }));
    });
  }
}
