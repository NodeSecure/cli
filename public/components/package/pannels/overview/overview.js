// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import { PopupMaintainer } from "../../../views/home/maintainers/maintainers.js";

// CONSTANTS
const kEnGBDateFormat = Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
});

export class Overview {
  constructor(pkg) {
    this.package = pkg;
  }

  get author() {
    const author = this.package.dependencyVersion.author;
    if (author === null || !("name" in author)) {
      return "Unknown";
    }

    return author.name.length > 26 ? `${author.name.slice(0, 26)}...` : author.name;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    const { usedBy } = this.package.dependencyVersion;

    clone.querySelector(".fields")
      .appendChild(this.renderTopFields());
    clone.querySelector(".fields.releases")
      .appendChild(this.renderReleases());

    utils.createItemsList(
      clone.getElementById("usedby"),
      Object.entries(usedBy).map(([name, version]) => `${name}@${version}`),
      {
        onclick: (_, npmSpec) => this.package.nsn.focusNodeByNameAndVersion(...Object.values(utils.parseNpmSpec(npmSpec))),
        hideItems: true
      }
    );

    // Fetch Github/Gitlab stats
    const githubLink = this.package.links.github;
    if (githubLink.showInHeader) {
      setTimeout(() => {
        document.querySelector(".gitlab-overview")?.classList.add("hidden");
      });

      this.fetchGithubStats(githubLink.href)
        .catch(console.error);
    }
    else {
      setTimeout(() => {
        document.querySelector(".github-overview")?.classList.add("hidden");
      });

      const gitlabLink = this.package.links.gitlab;
      if (gitlabLink.showInHeader) {
        this.fetchGitlabStats(gitlabLink.href)
          .catch(console.error);
      }
      else {
        setTimeout(() => {
          document.querySelector(".gitlab-overview").classList.add("hidden");
        });
      }
    }

    clone.querySelector(".package-maintainers")
      .appendChild(this.renderMaintainers());
  }

  async fetchGithubStats(githubLink) {
    const github = new URL(githubLink);
    const repoName = github.pathname.slice(
      1,
      github.pathname.includes(".git") ? -4 : github.pathname.length
    );

    const {
      stargazers_count,
      open_issues_count,
      forks_count
    } = await fetch(`https://api.github.com/repos/${repoName}`)
      .then((value) => value.json());

    document.querySelector(".github-stars").innerHTML = `<i class='icon-star'></i> ${stargazers_count}`;
    document.querySelector(".github-issues").textContent = open_issues_count;
    document.querySelector(".github-forks").textContent = forks_count;
  }

  async fetchGitlabStats(gitlabLink) {
    const gitlab = new URL(gitlabLink);
    const repoName = gitlab.pathname.slice(
      1,
      gitlab.pathname.includes(".git") ? -4 : gitlab.pathname.length
    );

    const {
      star_count,
      forks_count
    } = await fetch(`https://gitlab.com/api/v4/projects/${encodeURIComponent(repoName)}`)
      .then((value) => value.json());

    document.querySelector(".gitlab-stars").innerHTML = `<i class='icon-star'></i> ${star_count}`;
    document.querySelector(".gitlab-forks").textContent = forks_count;
  }

  renderTopFields() {
    const { size, composition, engines = {} } = this.package.dependencyVersion;
    const { metadata } = this.package.dependency;

    const fragment = document.createDocumentFragment();
    const i18n = window.i18n[utils.currentLang()];

    const { homepage } = this.package.links;
    if (typeof homepage.href === "string") {
      fragment.appendChild(utils.createLiField(
        i18n.package_info.overview.homepage, homepage.href, { isLink: true }
      ));
    }
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.author, this.author
    ));
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.size, prettyBytes(size)
    ));
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.dependencies, metadata.dependencyCount
    ));
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.files, composition.files.length
    ));
    fragment.appendChild(
      utils.createLiField("README.md", composition.files.some((file) => /README\.md/gi.test(file)) ? "✔️" : "❌")
    );
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.tsTypings, composition.files.some((file) => /d\.ts/gi.test(file)) ? "✔️" : "❌"
    ));
    if ("node" in engines) {
      fragment.appendChild(utils.createLiField(
        i18n.package_info.overview.npm, engines.node
      ));
    }
    if ("npm" in engines) {
      fragment.appendChild(utils.createLiField(
        i18n.package_info.overview.npm, engines.npm
      ));
    }

    return fragment;
  }

  renderReleases() {
    const { metadata } = this.package.dependency;
    const fragment = document.createDocumentFragment();
    const i18n = window.i18n[utils.currentLang()];

    const lastUpdatedAt = kEnGBDateFormat.format(
      new Date(this.package.dependency.metadata.lastUpdateAt)
    );

    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.lastReleaseVersion, metadata.lastVersion
    ));
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.lastReleaseDate, lastUpdatedAt
    ));
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.publishedReleases, metadata.publishedCount
    ));
    fragment.appendChild(utils.createLiField(
      i18n.package_info.overview.numberPublishers, metadata.publishers.length
    ));

    return fragment;
  }

  renderMaintainers() {
    const { metadata } = this.package.dependency;
    const fragment = document.createDocumentFragment();

    for (const author of metadata.maintainers) {
      const divElement = utils.createDOMElement("div", {
        childs: [
          utils.createAvatarImageElementForAuthor(author),
          utils.createDOMElement("p", {
            text: author.name
          }),
          "version" in author ?
            utils.createDOMElement("span", { text: `v${author.version}` }) :
            null
        ]
      });

      const result = this.package.nsn.secureDataSet.getAuthorByEmail(author.email);
      if (result !== null) {
        divElement.addEventListener("click", () => {
          const [name, data] = result;

          window.popup.open(
            new PopupMaintainer(name, data, this.package.nsn).render()
          );
        });
        divElement.classList.add("clickable");
      }

      fragment.appendChild(divElement);
    }

    return fragment;
  }
}
