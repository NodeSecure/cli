// Import Third-party Dependencies
import { getFlagsEmojisInlined, FLAGS_EMOJIS } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "../../../common/utils.js";

export class PackageHeader {
  static ExternalLinks = {
    socket: "https://socket.dev/npm/package/",
    snykAdvisor: "https://snyk.io/advisor/npm-package/"
  };

  constructor(pkg) {
    this.package = pkg;
    this.nsn = this.package.nsn;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    const {
      name: packageName,
      version: packageVersion,
      description: packageDescription = "",
      licenses,
      flags
    } = this.package.dependencyVersion;

    const [nameDomElement, versionDomElement, menuDomElement, descriptionDomElement, linksDomElement, flagsDomElement] = [
      clone.querySelector(".name"),
      clone.querySelector(".version"),
      clone.querySelector(".info"),
      clone.querySelector(".description"),
      clone.querySelector(".links"),
      clone.querySelector(".flags")
    ];

    // Name and Version
    nameDomElement.textContent = packageName;
    versionDomElement.textContent = `v${packageVersion}`;

    // Menu
    const menu = this.renderMenu(packageName);
    menuDomElement.insertAdjacentElement("afterend", menu);
    menuDomElement.addEventListener("click", () => {
      const menu = menuDomElement.parentNode.querySelector(".info-menu");
      if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
      }
      else {
        menu.classList.add("hidden");
      }
      utils.hideOnClickOutside(menu, {
        blacklist: [menuDomElement]
      });
    });

    // Description
    const description = packageDescription.trim();
    if (description === "") {
      descriptionDomElement.style.display = "none";
    }
    else {
      descriptionDomElement.textContent =
        description.length > 100 ? description.slice(0, 98) + "..." : description;
    }

    // Links
    const repositoryUrl = this.package.dependency.versions[packageVersion].links.repository;
    const repositoryUrlHostname = repositoryUrl ? new URL(repositoryUrl).hostname : null;

    const links = {
      npm: {
        href: this.package.dependency.versions[packageVersion].links.npm,
        text: "NPM",
        image: "npm-icon.svg",
        showInHeader: true
      },
      homepage: {
        href: this.package.dependency.versions[packageVersion].links.homepage,
        showInHeader: false
      },
      github: {
        href: repositoryUrl,
        text: "GitHub",
        image: "github-mark.png",
        showInHeader: repositoryUrlHostname === "github.com"
      },
      gitlab: {
        href: repositoryUrl,
        text: "GitLab",
        image: "gitlab-logo.png",
        showInHeader: repositoryUrlHostname === "gitlab.com"
      },
      unpkg: {
        href: `https://unpkg.com/${packageName}@${packageVersion}/`,
        text: "Unpkg",
        icon: "icon-cubes",
        showInHeader: true
      },
      licenses: this.getLicenses(licenses)
    };
    linksDomElement.appendChild(this.renderLinks(links));

    // Flags
    const flagFragment = this.renderFlags(flags);
    if (flagFragment) {
      flagsDomElement.appendChild(flagFragment);
    }

    // Has Duplicate Button
    if (this.#hasDuplicate()) {
      this.#renderHasDuplicateBtn(clone);
    }

    return links;
  }

  getLicenses(licenses) {
    const licensesResult = Object.create(null);

    for (const license of licenses) {
      for (const [licenseName, licenseUrl] of Object.entries(license.licenses)) {
        if (licenseName in licensesResult) {
          continue;
        }
        licensesResult[licenseName] = {
          href: licenseUrl,
          text: licenseName.toLocaleUpperCase(),
          icon: "icon-vcard",
          showInHeader: true
        };
      }
    }

    return Object.values(licensesResult);
  }

  renderLinks(links) {
    const fragment = document.createDocumentFragment();
    for (const [linkName, linkAttributes] of Object.entries(links)) {
      if (!linkAttributes.showInHeader || linkAttributes.href === null) {
        continue;
      }

      const linkImageOrIcon = linkAttributes.icon ?
        utils.createDOMElement("i", { classList: [linkAttributes.icon] }) :
        utils.createDOMElement("img", {
          attributes: { src: linkAttributes.image, alt: linkName }
        });

      fragment.appendChild(utils.createDOMElement("div", {
        childs: [
          linkImageOrIcon,
          utils.createDOMElement("a", {
            text: linkAttributes.text,
            attributes: {
              href: linkAttributes.href,
              target: "_blank",
              rel: "noopener noreferrer"
            }
          })
        ]
      }));
    }

    return fragment;
  }

  /**
   * @param {!string} packageName
   * @returns {HTMLElement[]}
   */
  renderMenu(packageName) {
    const { snykAdvisor, socket } = PackageHeader.ExternalLinks;
    const i18n = window.i18n[utils.currentLang()];

    return utils.createDOMElement("div", {
      classList: ["info-menu", "hidden"],
      childs: [
        utils.createDOMElement("div", {
          text: i18n.package_info.helpers.thirdPartyTools,
          classList: ["info-menu-title"]
        }),
        utils.createDOMElement("a", {
          text: "Snyk",
          attributes: {
            href: snykAdvisor + packageName,
            target: "_blank"
          }
        }),
        utils.createDOMElement("a", {
          text: "Socket.dev",
          attributes: {
            href: socket + packageName,
            target: "_blank"
          }
        })
      ]
    });
  }

  renderFlags(flags) {
    const { warnings, deprecated } = this.package.dependencyVersion;
    const warningsLength = warnings.filter(
      (warning) => !window.settings.config.ignore.warnings.has(warning.kind)
    ).length;

    const textContent = getFlagsEmojisInlined(flags, new Set(window.settings.config.ignore.flags));

    if (textContent === "") {
      return null;
    }

    const flagsMap = new Map(
      Object
        .entries(this.package.nsn.secureDataSet.FLAGS)
        .map(([name, row]) => [row.emoji, { ...row, name }])
    );
    const segmenter = new Intl.Segmenter("en", {
      granularity: "grapheme"
    });
    const segitr = segmenter.segment(textContent.replaceAll(" ", ""));

    const fragment = document.createDocumentFragment();
    for (const icon of Array.from(segitr, ({ segment }) => segment)) {
      if (flagsMap.has(icon)) {
        const { name } = flagsMap.get(icon);
        if (name === "warnings" && warningsLength === 0) {
          continue;
        }

        const htmlElement = createFlagInfoBulle(
          icon,
          name === "isDeprecated" ? deprecated : flagsMap.get(icon).tooltipDescription
        );
        htmlElement.addEventListener("click", () => {
          const { name } = flagsMap.get(icon);

          window.wiki.header.setNewActiveView("flags");
          window.wiki.navigation.flags.setNewActiveMenu(name);
          window.wiki.open();
        });

        fragment.appendChild(htmlElement);
      }
    }

    return fragment;
  }

  #hasDuplicate() {
    return this.package.dependencyVersion.flags.some((title) => title === "hasDuplicate") &&
      !window.settings.config.ignore.warnings.has("hasDuplicate") &&
      "isDuplicated" in FLAGS_EMOJIS;
  }

  #renderHasDuplicateBtn(clone) {
    const hasDuplicateBtn = utils.createDOMElement("button",
      { classList: ["has-duplicate"], text: FLAGS_EMOJIS.isDuplicated });

    const packagesList = this.nsn.secureDataSet.findPackagesByName(this.package.dependencyVersion.name)
      .map(({ name, version }) => `${name}@${version}`);

    hasDuplicateBtn.addEventListener("click", () => {
      const nodeIds = [...this.nsn.findNodeIds(new Set(packagesList))];
      this.nsn.highlightMultipleNodes(nodeIds);
      window.locker.lock();
    });

    const packageDescDiv = clone.querySelector(".package-description");
    packageDescDiv.appendChild(hasDuplicateBtn);
  }
}

function createFlagInfoBulle(text, description) {
  const spanElement = utils.createDOMElement("span", { text: description });

  return utils.createDOMElement("div", {
    classList: ["flag-infobulle"], text, childs: [spanElement]
  });
}
