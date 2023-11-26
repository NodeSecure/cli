// Import Third-party Dependencies
import { NodeSecureDataSet, getJSON } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "../utils.js";
import { Gauge } from "./gauge.js";
import { fetchScorecardData, getScoreColor, getScorecardLink } from "../scorecard.js";

export class HomeView {
  /**
   * @param {!NodeSecureDataSet} secureDataSet
   */
  constructor(secureDataSet) {
    this.secureDataSet = secureDataSet;

    this.generateScorecard();
    this.generateHeader();
    this.generateOverview();
    this.generateWarnings();
    this.generateExtensions();
    this.generateLicenses();
    this.generateMaintainers();
  }

  generateScorecard() {
    const { repository } = this.secureDataSet.linker.get(0);
    const repoName = utils.getGithubRepositoryPath(
      utils.parseRepositoryUrl(repository)
    )

    fetchScorecardData(repoName).then((data) => {
      if (data !== null) {
        document
          .querySelector(".home--header--scorecard .score")
          .classList.add(getScoreColor(data.score));
        document.getElementById("home-scorecard-score").innerHTML = data.score;
        const scorescardElement = document.querySelector(".home--header--scorecard");
        scorescardElement.addEventListener("click", () => {
          window.open(getScorecardLink(repoName), "_blank");
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
      if (config.href !== null) {
        liElement.addEventListener("click", () => window.open(config.href, "_blank"));
      }
      else {
        liElement.style.display = "none";
      }

      linksFragment.appendChild(liElement);
    }

    document.getElementById("project-links").appendChild(linksFragment);
  }

  async generateOverview() {
    const fragment = document.createDocumentFragment();

    const createOverviewDiv = (icon, title, value) => {
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
    };

    const { name } = this.secureDataSet.linker.get(0);
    let directDependencies = 0;
    for (const { usedBy } of this.secureDataSet.linker.values()) {
      if (name in usedBy) {
        directDependencies++;
      }
    }

    fragment.appendChild(createOverviewDiv("icon-cubes", "# dependencies", this.secureDataSet.dependenciesCount));
    fragment.appendChild(createOverviewDiv("icon-archive", "total size", this.secureDataSet.prettySize));
    fragment.appendChild(createOverviewDiv("icon-link", "# direct deps", directDependencies));
    fragment.appendChild(createOverviewDiv("icon-sitemap", "# transitive deps", this.secureDataSet.indirectDependencies));

    const homeOverviewElement = document.querySelector(".home--overview");
    homeOverviewElement.appendChild(fragment);

    try {

      const { downloads } = await getJSON(`/downloads/${name.replaceAll("/", "%2F")}`);

      if (downloads) {
        const formattedNumber = new Intl.NumberFormat("de-DE").format(downloads);
        homeOverviewElement.appendChild(createOverviewDiv("icon-chart-bar", "downloads last week", formattedNumber));
      }
    }
    catch {
      // DO NOTHING
    }
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
      .sort(([, left], [, right]) => right - left);

    document.getElementById("home-extensions").appendChild(
      new Gauge(extensions, { searchName: "ext" }).render()
    );
  }

  generateLicenses() {
    const licenses = [...Object.entries(this.secureDataSet.licenses)]
      .sort(([, left], [, right]) => right - left);

    document.getElementById("home-licenses").appendChild(
      new Gauge(licenses).render()
    );
  }

  generateMaintainers() {
    const fragment = document.createDocumentFragment();

    const createWhois = (name, email) => {
      const childs = [
        utils.createDOMElement("p", { text: name })
      ];
      if (typeof email === "string") {
        childs.push(utils.createDOMElement("span", { text: email }));
      }

      return utils.createDOMElement("div", {
        className: "whois", childs
      });
    }

    const authors = [...this.secureDataSet.authors.entries()]
      .sort((left, right) => right[1].count - left[1].count);
    for (const [name, data] of authors) {
      const { count, email, url = null } = data;

      const person = utils.createDOMElement("div", {
        className: "person",
        childs: [
          utils.createAvatarImageElement(email),
          createWhois(name, email),
          utils.createDOMElement("div", {
            className: "packagescount",
            childs: [
              utils.createDOMElement("i", { className: "icon-cube" }),
              utils.createDOMElement("p", { text: count })
            ]
          })
        ]
      });
      if (typeof url === "string") {
        person.addEventListener("click", () => window.open(url, "_blank"));
      }
      fragment.appendChild(person);
    }

    document.querySelector(".home--maintainers").appendChild(fragment);
  }
}
