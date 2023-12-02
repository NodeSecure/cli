// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";

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
      Object.keys(usedBy),
      {
        onclick: (_, packageName) => this.package.nsn.focusNodeByName(packageName),
        hideItems: true
      }
    );

    // Fetch Github stats
    const githubLink = this.package.links.github;
    if (githubLink.href !== null) {
      this.fetchGithubStats(githubLink.href)
        .catch(console.error);
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

  renderTopFields() {
    const { size, composition, engines } = this.package.dependencyVersion;
    const { metadata } = this.package.dependency;

    const fragment = document.createDocumentFragment();

    const { homepage } = this.package.links;
    if (homepage.href !== null) {
      fragment.appendChild(utils.createLiField("Homepage", homepage.href, { isLink: true }));
    }
    fragment.appendChild(utils.createLiField("Author", this.author));
    fragment.appendChild(utils.createLiField("Size on system", prettyBytes(size)));
    fragment.appendChild(utils.createLiField("Number of dependencies", metadata.dependencyCount));
    fragment.appendChild(utils.createLiField("Number of files", composition.files.length));
    fragment.appendChild(
      utils.createLiField("README.md", composition.files.some((file) => /README\.md/gi.test(file)) ? "✔️" : "❌")
    );
    fragment.appendChild(utils.createLiField("TS Typings", composition.files.some((file) => /d\.ts/gi.test(file)) ? "✔️" : "❌"));
    if ("node" in engines) {
      fragment.appendChild(utils.createLiField("Node.js compatibility", engines.node));
    }
    if ("npm" in engines) {
      fragment.appendChild(utils.createLiField("NPM compatibility", engines.npm));
    }

    return fragment;
  }

  renderReleases() {
    const { metadata } = this.package.dependency;
    const fragment = document.createDocumentFragment();

    const lastUpdatedAt = kEnGBDateFormat.format(
      new Date(this.package.dependency.metadata.lastUpdateAt)
    );

    fragment.appendChild(utils.createLiField("Last release version", metadata.lastVersion));
    fragment.appendChild(utils.createLiField("Last release date", lastUpdatedAt));
    fragment.appendChild(utils.createLiField("Number of published releases", metadata.publishedCount));
    fragment.appendChild(utils.createLiField("Number of publisher(s)", metadata.publishers.length));

    return fragment;
  }

  renderMaintainers() {
    const { metadata } = this.package.dependency;
    const fragment = document.createDocumentFragment();

    for (const author of metadata.maintainers) {
      const img = utils.createAvatarImageElement(author.email);
      fragment.appendChild(utils.createDOMElement("div", { childs: [img] }));
    }

    return fragment;
  }
}
