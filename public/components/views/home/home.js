// Import Third-party Dependencies
import { NodeSecureDataSet, getFlagsEmojisInlined, getJSON } from "@nodesecure/vis-network";
import { licenseIdConformance } from "@nodesecure/licenses-conformance";
import { getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";

// Import Internal Dependencies
import * as utils from "../../../common/utils.js";
import "../../gauge/gauge.js";
import "../../expandable/expandable.js";
import { EVENTS } from "../../../core/events.js";
import { fetchScorecardData, getScorecardLink } from "../../../common/scorecard.js";

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

const kEmojiDescription = {
  "📦": "scripts",
  "⚔️": "sensitive files",
  "🚨": "vulnerabilities",
  "⛔️": "deprecated"
};

export class HomeView {
  /**
   * @param {!NodeSecureDataSet} secureDataSet
   */
  constructor(
    secureDataSet,
    nsn
  ) {
    this.secureDataSet = secureDataSet;
    this.nsn = nsn;
    this.lang = utils.currentLang();

    const homeViewHTMLElement = document.getElementById("home--view");
    homeViewHTMLElement.innerHTML = "";
    homeViewHTMLElement.appendChild(this.render());

    if (window.settings.config.disableExternalRequests === false) {
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
    const template = document.getElementById("home-view-content");
    if (!template) {
      throw new Error("Unable to find HTML template with ID 'home-view-content'");
    }

    /** @type {HTMLTemplateElement} */
    const clone = document.importNode(template.content, true);

    return clone;
  }

  generateScorecard() {
    const { name, version } = this.secureDataSet.linker.get(0);
    const pkg = this.secureDataSet.data.dependencies[name];
    const { repository } = pkg.versions[version].links;

    if (repository === null || repository === undefined) {
      return;
    }

    const [repoName, platform] = getVCSRepositoryPathAndPlatform(repository) ?? [];

    fetchScorecardData(repoName, platform).then((data) => {
      if (data !== null) {
        document
          .querySelector(".home--header--scorecard .score")
          .classList.add(getScoreColor(data.score));
        document.getElementById("home-scorecard-score").innerHTML = data.score;
        const scorescardElement = document.querySelector(".home--header--scorecard");
        scorescardElement.addEventListener("click", () => {
          window.open(getScorecardLink(repoName, platform), "_blank");
        });
        scorescardElement.style.display = "flex";
      }
    });
  }

  generateHeader() {
    const { name, version, description, repository } = this.secureDataSet.linker.get(0);

    document.getElementById("project-name").textContent = name;
    document.getElementById("project-version").textContent = version;
    document.getElementById("project-description").textContent = description;

    const linksFragment = document.createDocumentFragment();
    const links = {
      NPM: {
        src: "npm-icon.svg",
        href: `https://www.npmjs.com/package/${name}/v/${version}`
      },
      Github: {
        src: "github-black.png",
        href: utils.parseRepositoryUrl(repository)
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
        liElement.addEventListener("click", () => window.open(config.href, "_blank"));
      }

      linksFragment.appendChild(liElement);
    }

    document.getElementById("project-links").appendChild(linksFragment);
  }

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
        utils.createDOMElement("span", { text: value })
      ]
    });
  }

  async generateOverview() {
    const fragment = document.createDocumentFragment();

    const { name } = this.secureDataSet.linker.get(0);
    let directDependencies = 0;
    for (const { usedBy } of this.secureDataSet.linker.values()) {
      if (name in usedBy) {
        directDependencies++;
      }
    }
    fragment.appendChild(this.#createOverviewDiv(
      "icon-cubes", `# ${window.i18n[this.lang].home.overview.dependencies}`, this.secureDataSet.dependenciesCount
    ));
    fragment.appendChild(this.#createOverviewDiv(
      "icon-archive", window.i18n[this.lang].home.overview.totalSize, this.secureDataSet.prettySize
    ));
    fragment.appendChild(this.#createOverviewDiv(
      "icon-link", `# ${window.i18n[this.lang].home.overview.directDeps}`, directDependencies
    ));
    fragment.appendChild(this.#createOverviewDiv(
      "icon-sitemap", `# ${window.i18n[this.lang].home.overview.transitiveDeps}`, this.secureDataSet.indirectDependencies
    ));

    const homeOverviewElement = document.querySelector(".home--overview");
    homeOverviewElement.appendChild(fragment);

    if (window.settings.config.disableExternalRequests) {
      return;
    }

    this.generateDownloads();
  }

  generatePackagesToWatch() {
    const maxPackages = 4;
    const fragment = document.createDocumentFragment();

    const deps = [];
    for (const dependency of Object.values(this.secureDataSet.data.dependencies)) {
      for (const dependencyVer of Object.values(dependency.versions)) {
        const { flags } = dependencyVer;

        const hasFlag = flags.some((name) => kFlagsToWatch.has(name));
        if (hasFlag) {
          deps.push(dependencyVer);
        }
      }
    }

    const hideItems = deps.length > maxPackages;
    for (let id = 0; id < deps.length; id++) {
      const dependency = deps[id];

      const element = this.renderPackage(dependency);
      element.addEventListener("click", () => {
        window.navigation.setNavByName("network--view");
        setTimeout(() => this.nsn.focusNodeByNameAndVersion(dependency.name, dependency.version), 25);
      });
      if (hideItems && id >= maxPackages) {
        element.classList.add("hidden");
      }

      fragment.appendChild(element);
    }

    if (fragment.children.length === 0) {
      document.getElementById("homewatch").style.display = "none";
    }
    else {
      if (hideItems) {
        const expandableSpan = document.createElement("expandable-span");
        expandableSpan.onToggle = (expandable) => utils.toggle(expandable,
          document.querySelector(".home--packages--overview"),
          maxPackages);
        fragment.appendChild(expandableSpan);
      }

      document.querySelector(".home--packages--overview")
        .appendChild(fragment);
    }
  }

  renderPackage(dependencyVer) {
    const { name, version, flags, deprecated } = dependencyVer;
    const inlinedEmojis = getFlagsEmojisInlined(
      flags.filter((name) => kFlagsToWatch.has(name)),
      new Set(window.settings.config.ignore.flags)
    );

    const childs = utils.extractEmojis(inlinedEmojis)
      .map((emoji) => utils.createDOMElement("p", { text: `${emoji} ${kEmojiDescription[emoji]}` }));

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

    return utils.createDOMElement("div", {
      childs: packageContents
    });
  }

  generateWarnings() {
    const warningsModuleElement = document.getElementById("warnings-module");
    if (this.secureDataSet.warnings.length === 0) {
      warningsModuleElement.style.display = "none";

      return;
    }

    const fragment = document.createDocumentFragment();
    for (const text of this.secureDataSet.warnings) {
      fragment.appendChild(utils.createDOMElement("p", { text }));
    }

    warningsModuleElement.querySelector(".count").textContent = this.secureDataSet.warnings.length;
    warningsModuleElement.querySelector(".home--warnings").appendChild(fragment);
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

    document.getElementById("home-extensions").appendChild(gauge);
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
            chips: Object.entries(result.value.spdx)
              .filter(([key]) => key !== "includesDeprecated")
              .map(([key, value]) => `${value ? "✔️" : "❌"} ${key}`)
          }
        ];
      });

    const gauge = document.createElement("gauge-bar");
    gauge.data = licenses;
    gauge.theme = this.secureDataSet.theme;

    document.getElementById("home-licenses").appendChild(gauge);
  }

  generateMaintainers() {
    const maintainers = document.createElement("nsecure-maintainers");
    maintainers.secureDataSet = this.secureDataSet;
    maintainers.nsn = this.nsn;
    maintainers.theme = this.secureDataSet.theme;
    maintainers.options = {
      maximumMaintainers: 5
    };
    const pannel = document.getElementById("pannel-right");
    pannel.prepend(maintainers);
  }

  generateModuleTypes() {
    const moduleTypesElement = document.getElementById("home-modules-types");
    const moduleTypes = Object.values(this.secureDataSet.data.dependencies).reduce((acc, dep) => {
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
    const homeOverviewElement = document.querySelector(".home--overview");
    const { name } = this.secureDataSet.linker.get(0);

    try {
      const { downloads } = await getJSON(`/downloads/${name.replaceAll("/", "%2F")}`);

      if (downloads) {
        const downloadsElement = document.querySelector(".home--overview div:has(i.icon-chart-bar)");
        downloadsElement?.remove();
        const formattedNumber = new Intl.NumberFormat("de-DE").format(downloads);
        homeOverviewElement.appendChild(this.#createOverviewDiv(
          "icon-chart-bar",
          window.i18n[this.lang].home.overview.downloadsLastWeek,
          formattedNumber
        ));
      }
    }
    catch {
      // DO NOTHING
    }
  }

  handleReport() {
    document.querySelector(".home--header--report").addEventListener("click", async() => {
      const popupReport = document.createElement("popup-report");
      popupReport.rootDependencyName = this.secureDataSet.data.rootDependencyName;
      popupReport.theme = this.secureDataSet.theme;
      window.dispatchEvent(new CustomEvent(EVENTS.MODAL_OPENED, {
        detail: {
          content: popupReport
        }
      }));
    });
  }
}
