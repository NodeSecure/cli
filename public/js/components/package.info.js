// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";
import { getFlagsEmojisInlined, getJSON } from "@nodesecure/vis-network";
import { locationToString } from "@nodesecure/utils";

// Import Internal Dependencies
import * as utils from "../utils.js";
import { Bundlephobia } from "./bundlephobia.js";
import { UnpkgCodeFetcher } from "./unpkgCodeFetcher.js";

export class PackageInfo {
  static DOMElementName = "package-info";
  static StopSimulationTimeout = null;

  static close() {
    const domElement = document.getElementById(PackageInfo.DOMElementName);
    if (domElement.classList.contains("slide-in")) {
      domElement.setAttribute("class", "slide-out");
    }
  }

  /**
   * @param {*} dependencyVersionData
   * @param {*} dependency
   * @param {*} nsn
   */
  constructor(dependencyVersionData, currentNode, dependency, nsn) {
    this.codeCache = new Map();
    this.nsn = nsn;
    this.currentNode = currentNode;
    this.dom = document.getElementById(PackageInfo.DOMElementName);
    this.dom.innerHTML = "";
    this.menus = new Map();

    const { name, version } = dependencyVersionData;
    this.dependencyVersion = dependencyVersionData;
    this.dependency = dependency;

    const template = document.getElementById("package-info-template");
    /** @type {HTMLTemplateElement} */
    const clone = document.importNode(template.content, true);

    this.activeNavigation = clone.querySelector(".package-navigation > div.active");
    this.setupNavigation(clone);
    this.hydrateAndGenerate(clone);

    for (const domElement of clone.querySelectorAll(".open-wiki")) {
      domElement.addEventListener("click", () => {
        window.wiki.header.setNewActiveView("warnings");
        window.wiki.open();
      });
    }

    this.dom.appendChild(clone);
    this.enableNavigation(window.settings.config.defaultPackageMenu);
    this.open();

    // Fetch Github stats
    if (this.links.github.href !== null) {
      this.fetchGithubStats().catch(console.error);
    }

    // Fetch bundlephobia size stats
    new Bundlephobia(name, version)
      .fetchDataOnHttpServer()
      .catch(console.error);
  }

  get isLocalProject() {
    return this.currentNode === 0 || this.dependencyVersion.flags.includes("isGit");
  }

  open() {
    this.dom.setAttribute("class", "slide-in");
  }

  async fetchGithubStats() {
    const github = new URL(this.links.github.href);
    const repoName = github.pathname.slice(1, github.pathname.includes(".git") ? -4 : github.pathname.length);

    const { stargazers_count, open_issues_count, forks_count } = await fetch(`https://api.github.com/repos/${repoName}`)
      .then((value) => value.json());

    document.querySelector(".github-stars").innerHTML = `<i class='icon-star'></i> ${stargazers_count}`;
    document.querySelector(".github-issues").textContent = open_issues_count;
    document.querySelector(".github-forks").textContent = forks_count;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  setupNavigation(clone) {
    for (const div of clone.querySelectorAll(".package-navigation > div")) {
      const dataMenu = div.getAttribute("data-menu");
      this.menus.set(dataMenu, div);

      div.addEventListener("click", () => this.enableNavigation(dataMenu));
    }
  }

  setupNavigationSignal(navElement, count = 0) {
    if (count === 0) {
      navElement.classList.add("disabled");
    }
    else {
      const counter = navElement.querySelector(".signal");
      counter.style.display = "flex";
      counter.appendChild(document.createTextNode(count));
    }
  }

  enableNavigation(name) {
    const div = this.menus.has(name) ? this.menus.get(name) : this.menus.get("info");

    const isActive = div.classList.contains("active");
    const isDisabled = div.classList.contains("disabled");
    const dataTitle = div.getAttribute("data-title");

    if (isActive || isDisabled) {
      return;
    }

    div.classList.add("active");
    this.activeNavigation.classList.remove("active");

    const targetPan = document.getElementById(`pan-${name}`);
    const currentPan = document.getElementById(`pan-${this.activeNavigation.getAttribute("data-menu")}`);
    targetPan.classList.remove("hidden");
    currentPan.classList.add("hidden");
    document.querySelector(".container-title").textContent = dataTitle;

    this.activeNavigation = div;
  }

  get lastUpdateAt() {
    return Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
    }).format(new Date(this.dependency.metadata.lastUpdateAt));
  }

  get author() {
    const author = this.dependencyVersion.author;
    const flatAuthorFullname = typeof author === "string" ? author : (author?.name ?? "Unknown");

    return flatAuthorFullname.length > 26 ? `${flatAuthorFullname.slice(0, 26)}...` : flatAuthorFullname;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  hydrateAndGenerate(clone) {
    const { name, version, size, composition, warnings, usedBy, engines, flags } = this.dependencyVersion;
    const { metadata, vulnerabilities } = this.dependency;

    const [maintainersDomElement, licensesDomElement, warningsDomElement, scriptsDomElement, vulnDomElement, ossfScorecardDomElement] = [
      clone.querySelector(".package-maintainers"),
      clone.getElementById("pan-licenses"),
      clone.getElementById("pan-warnings"),
      clone.querySelector(".package-scripts"),
      clone.querySelector(".packages-vuln"),
      clone.getElementById("pan-scorecard")
    ];
    const [fieldsDefault, fieldsReleases] = [
      clone.querySelector(".fields"),
      clone.querySelector(".fields.releases")
    ];

    this.generateHeader(clone);
    if (flags.includes("hasScript")) {
      this.setupNavigationSignal(clone.getElementById("dependencies-nav-menu"), "!");
    }
    {
      const warningsLength = warnings.filter((warning) => !window.settings.warnings.has(warning.kind)).length;
      this.setupNavigationSignal(clone.getElementById("warnings-nav-menu"), warningsLength);
    }

    this.setupNavigationSignal(clone.getElementById("vulnerabilities-nav-menu"), vulnerabilities.length);

    {
      const doc = document.createDocumentFragment();

      if (this.links.homepage.href !== null) {
        doc.appendChild(utils.createLiField("Homepage", this.links.homepage.href, { isLink: true }));
      }
      doc.appendChild(utils.createLiField("Author", this.author));
      doc.appendChild(utils.createLiField("Size on system", prettyBytes(size)));
      doc.appendChild(utils.createLiField("Number of dependencies", metadata.dependencyCount));
      doc.appendChild(utils.createLiField("Number of files", composition.files.length));
      doc.appendChild(utils.createLiField("README.md", composition.files.some((file) => /README\.md/gi.test(file)) ? "✔️" : "❌"));
      doc.appendChild(utils.createLiField("TS Typings", composition.files.some((file) => /d\.ts/gi.test(file)) ? "✔️" : "❌"));
      if ("node" in engines) {
        doc.appendChild(utils.createLiField("Node.js compatibility", engines.node));
      }
      if ("npm" in engines) {
        doc.appendChild(utils.createLiField("NPM compatibility", engines.npm));
      }

      fieldsDefault.appendChild(doc);
    }
    {
      const doc = document.createDocumentFragment();

      doc.appendChild(utils.createLiField("Last release version", metadata.lastVersion));
      doc.appendChild(utils.createLiField("Last release date", this.lastUpdateAt));
      doc.appendChild(utils.createLiField("Number of published releases", metadata.publishedCount));
      doc.appendChild(utils.createLiField("Number of publisher(s)", metadata.publishers.length));

      fieldsReleases.appendChild(doc);
    }

    utils.createItemsList(clone.getElementById("nodedep"), composition.required_nodejs, {
      hideItemsLength: 8,
      onclick: (event, coreLib) => {
        function formatNodeLib(lib) {
          return lib.startsWith('node:') ? lib.slice(5) : lib;
        }

        window.open(`https://nodejs.org/dist/latest/docs/api/${formatNodeLib(coreLib)}.html`, "_blank").focus();
      }
    });

    const onclick = (_, fileName) => {
      if (fileName === "../" || fileName === "./") {
        return;
      }
      const cleanedFile = fileName.startsWith("./") ? fileName.slice(2) : fileName;
      window.open(`https://unpkg.com/${name}@${version}/${cleanedFile}`, "_blank").focus();
    };

    utils.createItemsList(clone.getElementById("extensions"), composition.extensions);
    utils.createItemsList(clone.getElementById("tarballfiles"), composition.files, {
      onclick, hideItems: true, hideItemsLength: 3
    });

    utils.createItemsList(clone.getElementById("minifiedfiles"), composition.minified, {
      onclick, hideItems: true
    });
    utils.createItemsList(clone.getElementById("unuseddep"), composition.unused);
    utils.createItemsList(clone.getElementById("missingdep"), composition.missing);

    const onclickFocusNetworkNode = (_, packageName) => this.nsn.focusNodeByName(packageName);
    utils.createItemsList(clone.getElementById("requireddep"), composition.required_thirdparty, {
      onclick: onclickFocusNetworkNode,
      hideItems: true
    });
    utils.createItemsList(clone.getElementById("usedby"), Object.keys(usedBy), { onclick: onclickFocusNetworkNode, hideItems: true });
    utils.createItemsList(clone.getElementById("internaldep"), composition.required_files, {
      onclick,
      hideItems: true,
      hideItemsLength: 3
    });
    licensesDomElement.appendChild(this.generateLicenses());
    maintainersDomElement.appendChild(this.generateMaintainers());
    warningsDomElement.appendChild(this.generateWarnings());
    scriptsDomElement.appendChild(this.generateScripts());
    vulnDomElement.appendChild(this.generateVulnerabilities());

    this.generateOssfScorecard(name).then(
      (ossfScorecardElementChildren) => {
        if (ossfScorecardElementChildren) {
          ossfScorecardDomElement.appendChild(ossfScorecardElementChildren);
          document.getElementById('scorecard-menu').style.display = 'flex';
        }
      }
    );

    const strategy = window.vulnerabilityStrategy;
    clone.querySelector(".vuln-strategy .name").textContent = strategy;

    /** @type {HTMLImageElement} */
    const strategyLogo = clone.querySelector(".vuln-strategy img");
    if (strategy === "none") {
      strategyLogo.style.display = "none";
    }
    else {
      strategyLogo.src = strategy === "npm" ? "npm-icon.svg" : `${strategy}.png`;
    }

    const btnShow = clone.getElementById("show-hide-dependency");
    if (this.currentNode === 0) {
      btnShow.classList.add("disabled");

      return;
    }
    btnShow.innerHTML = this.dependencyVersion.hidden ? "<i class='icon-eye'></i> show" : "<i class='icon-eye-off'></i> hide";

    if (this.dependency.metadata.dependencyCount === 0) {
      btnShow.classList.add("disabled");
    }
    else {
      btnShow.addEventListener("click", () => {
        const currBtn = document.getElementById("show-hide-dependency");
        currBtn.classList.toggle("active");
        const hidden = !this.dependencyVersion.hidden;

        currBtn.innerHTML = hidden ? "<i class='icon-eye'></i> show" : "<i class='icon-eye-off'></i> hide";

        this.nsn.highlightNodeNeighbour(this.currentNode, hidden);
        if (PackageInfo.StopSimulationTimeout !== null) {
          clearTimeout(PackageInfo.StopSimulationTimeout);
        }
        PackageInfo.StopSimulationTimeout = setTimeout(() => {
          this.nsn.network.stopSimulation();
          PackageInfo.StopSimulationTimeout = null;
        }, 500);
        this.dependencyVersion.hidden = !this.dependencyVersion.hidden;
      });
    }
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generateHeader(clone) {
    const { license } = this.dependencyVersion;
    const [nameDomElement, versionDomElement, descriptionDomElement, linksDomElement, flagsDomElement] = [
      clone.querySelector(".name"),
      clone.querySelector(".version"),
      clone.querySelector(".package-description"),
      clone.querySelector(".package-links"),
      clone.querySelector(".package-flags")
    ]

    // Name and Version
    nameDomElement.textContent = this.dependencyVersion.name;
    if (this.dependencyVersion.name.length >= 18) {
      nameDomElement.classList.add("lowsize");
    }
    versionDomElement.textContent = `v${this.dependencyVersion.version}`;

    // Description
    const description = this.dependencyVersion.description.trim();
    if (description === "") {
      descriptionDomElement.style.display = "none";
    }
    else {
      descriptionDomElement.textContent = description;
    }

    // Links
    const packageHomePage = this.dependency.metadata.homepage || null;
    const packageGithubPage = utils.parseRepositoryUrl(
      this.dependencyVersion.repository,
      packageHomePage !== null && new URL(packageHomePage).hostname === "github.com" ? packageHomePage : null
    );

    const hasNoLicense = license === "unkown license";
    this.links = {
      npm: {
        href: `https://www.npmjs.com/package/${this.dependencyVersion.name}/v/${this.dependencyVersion.version}`,
        text: "NPM",
        image: "npm-icon.svg",
        showInHeader: true
      },
      homepage: {
        href: packageHomePage,
        showInHeader: false
      },
      github: {
        href: packageGithubPage,
        text: "GitHub",
        image: "github-mark.png",
        showInHeader: true
      },
      unpkg: {
        href: `https://unpkg.com/${this.dependencyVersion.name}@${this.dependencyVersion.version}/`,
        text: "Unpkg",
        icon: "icon-cubes",
        showInHeader: true
      },
      license: {
        href: hasNoLicense ? "#" : (license.licenses[0]?.spdxLicenseLinks[0] ?? "#"),
        text: hasNoLicense ? "unkown" : license.uniqueLicenseIds.join(", ").toUpperCase(),
        icon: "icon-vcard",
        showInHeader: true
      }
    };

    {
      const linksFragment = document.createDocumentFragment();
      for (const [linkName, linkAttributes] of Object.entries(this.links)) {
        if (!linkAttributes.showInHeader || linkAttributes.href === null) {
          continue;
        }
        const linkImageOrIcon = linkAttributes.icon ?
          utils.createDOMElement("i", { classList: [linkAttributes.icon] }) :
          utils.createDOMElement("img", {
            attributes: { src: linkAttributes.image, alt: linkName }
          });

        const linksChildren = [
          linkImageOrIcon,
          utils.createDOMElement("a", {
            text: linkAttributes.text,
            attributes: {
              href: linkAttributes.href,
              target: "_blank",
              rel: "noopener noreferrer"
            }
          })
        ];

        linksFragment.appendChild(utils.createDOMElement("div", {
          className: "link", childs: linksChildren
        }));
      }

      linksDomElement.appendChild(linksFragment);
    }

    // Flags
    {
      const textContent = getFlagsEmojisInlined(this.dependencyVersion.flags, new Set(window.settings.config.ignore.flags));

      if (textContent === "") {
        flagsDomElement.style.display = "none";
      }
      else {
        const flagsMap = new Map(
          Object.entries(this.nsn.secureDataSet.FLAGS).map(([name, row]) => [row.emoji, { ...row, name }])
        );

        const flagsFragment = document.createDocumentFragment();
        for (const icon of textContent) {
          if (flagsMap.has(icon)) {
            const tooltipElement = utils.createTooltip(icon, flagsMap.get(icon).tooltipDescription);
            tooltipElement.addEventListener("click", () => {
              const { name } = flagsMap.get(icon);

              wiki.header.setNewActiveView("flags");
              wiki.navigation.flags.setNewActiveMenu(name);
              wiki.open();
            });

            flagsFragment.appendChild(tooltipElement);
          }
        }
        flagsDomElement.appendChild(flagsFragment);
      }
    }
  }

  generateLicenses() {
    const licensesFragment = document.createDocumentFragment();
    if (typeof this.dependencyVersion.license === "string") {
      return licensesFragment;
    }

    for (const license of this.dependencyVersion.license.licenses) {
      const [licenseName] = license.uniqueLicenseIds;
      const [licenseLink] = license.spdxLicenseLinks;

      const spdx = Object.entries(license.spdx)
        .map(([key, value]) => `${value ? "✔️" : "❌"} ${key}`);

      const boxContainer = utils.createDOMElement("div", {
        classList: ["box-container-licenses"],
        childs: spdx.map((text) => utils.createDOMElement("div", { text }))
      });

      const box = utils.createFileBox({
        title: licenseName,
        fileName: license.from,
        childs: [boxContainer],
        titleHref: licenseLink,
        fileHref: `${this.links.unpkg.href}${license.from}`
      });
      licensesFragment.appendChild(box);
    }

    return licensesFragment;
  }

  generateMaintainers() {
    const maintainersFragment = document.createDocumentFragment();
    for (const author of this.dependency.metadata.maintainers) {
      const img = utils.createAvatarImageElement(author.email);
      maintainersFragment.appendChild(utils.createDOMElement("div", { childs: [img] }));
    }

    return maintainersFragment;
  }

  generateWarnings() {
    const warningsFragment = document.createDocumentFragment();
    const codeFetcher = new UnpkgCodeFetcher(this.links.unpkg.href);

    for (const warning of this.dependencyVersion.warnings) {
      if (window.settings.warnings.has(warning.kind)) {
        continue;
      }
      const multipleLocation = warning.kind === "encoded-literal" ?
        warning.location.map((loc) => locationToString(loc)).join(" // ") :
        locationToString(warning.location);

      const id = Math.random().toString(36).slice(2);
      const hasNoInspection =
        warning.file.includes(".min") &&
        warning.kind === "short-identifiers" &&
        warning.kind === "obfuscated-code";

      const viewMoreElement = utils.createDOMElement("div", {
        className: "view-more",
        childs: [
          utils.createDOMElement("i", { className: "icon-code" })
        ]
      });

      if (this.isLocalProject || hasNoInspection) {
        viewMoreElement.style.display = "none";
      }
      else {
        const location = warning.kind === "encoded-literal" ? warning.location[0] : warning.location;

        viewMoreElement.addEventListener("click", (event) => {
          codeFetcher.fetchCodeLine(event, { file: warning.file, location, id });
        });
      }

      const boxContainer = utils.createDOMElement("div", {
        classList: ["box-container-warning"],
        childs: [
          utils.createDOMElement("div", {
            className: "info",
            childs: [
              utils.createDOMElement("p", {
                className: "title",
                text: "incrimined value"
              }),
              utils.createDOMElement("p", {
                className: "value",
                text: warning.value && warning.value.length > 200 ? `${warning.value.slice(0, 200)}...` : warning.value
              })
            ]
          }),
          viewMoreElement
        ]
      });
      const boxPosition = utils.createDOMElement("div", {
        className: "box-source-code-position",
        childs: [
          utils.createDOMElement("p", { text: multipleLocation })
        ]
      });

      const box = utils.createFileBox({
        title: warning.kind,
        fileName: warning.file.length > 20 ? `${warning.file.slice(0, 20)}...` : warning.file,
        childs: [boxContainer, boxPosition],
        titleHref: `https://github.com/NodeSecure/js-x-ray/blob/master/docs/${warning.kind}.md`,
        fileHref: `${this.links.unpkg.href}${warning.file}`,
        severity: warning.severity ?? "Information"
      })
      warningsFragment.appendChild(box);
    }

    return warningsFragment;
  }

  generateScripts() {
    const fragment = document.createDocumentFragment();
    const createPElement = (className, text) => utils.createDOMElement("p", { className, text });

    const scripts = Object.entries(this.dependencyVersion.scripts);
    const hideItemsLength = 4;
    const hideItems = scripts.length > hideItemsLength;

    for (let id = 0; id < scripts.length; id++) {
      const [key, value] = scripts[id];

      const script = utils.createDOMElement("div", {
        className: "script",
        childs: [
          createPElement("name", key),
          createPElement("value", value)
        ]
      });
      if (hideItems && id >= hideItemsLength) {
        script.classList.add("hidden");
      }

      fragment.appendChild(script);
    }

    if (hideItems) {
      fragment.appendChild(utils.createExpandableSpan(hideItemsLength));
    }

    return fragment;
  }

  generateVulnerabilities() {
    const fragment = document.createDocumentFragment();
    const defaultHrefProperties = { target: "_blank", rel: "noopener noreferrer" };

    for (const vuln of this.dependency.vulnerabilities) {
      const severity = vuln.severity ?? "info";
      const vulnerableSemver = vuln.vulnerableRanges[0] ?? "N/A";

      const header = utils.createDOMElement("div", {
        childs: [
          utils.createDOMElement("div", {
            classList: ["severity", severity],
            text: severity.charAt(0).toUpperCase()
          }),
          utils.createDOMElement("p", { className: "name", text: vuln.package }),
          utils.createDOMElement("span", { text: vulnerableSemver })
        ]
      });
      const description = utils.createDOMElement("div", {
        className: "description",
        childs: [utils.createDOMElement("p", { text: vuln.title })]
      });
      const links = utils.createDOMElement("div", {
        className: "links",
        childs: [
          utils.createDOMElement("i", { className: "icon-link" }),
          utils.createDOMElement("a", {
            text: vuln.url,
            attributes: { href: vuln.url, ...defaultHrefProperties }
          })
        ]
      });

      const vulnDomElement = utils.createDOMElement("div", {
        classList: ["vuln", severity],
        childs: [
          header,
          description,
          links
        ]
      });
      fragment.appendChild(vulnDomElement);
    }

    return fragment;
  }

  async generateOssfScorecard() {
    if (!this.links.github.href) {
      document.getElementById('scorecard-menu').style.display = 'none';
      return;
    }

    const github = new URL(this.links.github.href);
    const repoName = github.pathname.slice(1, github.pathname.includes(".git") ? -4 : github.pathname.length);

    let data;

    try {
      data = (await getJSON(`/scorecard/${repoName}`)).data;
    }
    catch (error) {
      console.error(error);
      document.getElementById('scorecard-menu').style.display = 'none';

      return null;
    }

    if (!data) {
      return;
    }

    const { score, checks } = data;
    const checksContainerElement = utils.createDOMElement('div', {
      classList: ['checks'],
    });

    function generateCheckElement(check) {
      if (!check.score || check.score < 0) {
        check.score = 0;
      }

      const fragment = document.createDocumentFragment();
      fragment.appendChild(
        utils.createDOMElement('div', {
          classList: ['check'],
          childs: [
            utils.createDOMElement('span', {
              classList: ['name'],
              text: check.name,
            }),
            utils.createDOMElement('div', {
              classList: ['score'],
              text: `${check.score}/10`,
            }),
            utils.createDOMElement('div', {
              classList: ['info'],
              childs: [
                utils.createDOMElement('div', {
                  classList: ['description'],
                  text: check.documentation.short,
                }),
                utils.createDOMElement('div', {
                  classList: ['reason'],
                  childs: [
                    utils.createDOMElement('p', {
                      childs: [
                        utils.createDOMElement('strong', {
                          text: "Reasoning",
                        }),
                      ],
                    }),
                    utils.createDOMElement('span', {
                      text: check.reason,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );

      for (const detail of check.details ?? []) {
        fragment.querySelector('.info').appendChild(
          utils.createDOMElement('div', {
            classList: ['detail'],
            text: detail,
          }),
        );
      }

      return fragment;
    }

    for (const check of checks) {
      checksContainerElement.append(generateCheckElement(check));
    }

    document.getElementById('ossf-score').innerText = score;
    document.getElementById('head-score').innerText = score;

    const checksNodes = checksContainerElement.childNodes;
    checksNodes.forEach((check, checkKey) => {
      check.addEventListener('click', () => {
        if (check.children[2].classList.contains('visible')) {
          check.children[2].classList.remove('visible');
          check.classList.remove('visible')

          return;
        }

        check.classList.add('visible');
        check.children[2].classList.add('visible');

        checksNodes.forEach((check, key) => {
          if (checkKey !== key) {
            check.classList.remove('visible');
            check.children[2].classList.remove('visible');
          }
        });
      });
    });

    return checksContainerElement;
  }
}
