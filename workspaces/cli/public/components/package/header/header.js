// Import Third-party Dependencies
import { getFlagsEmojisInlined, FLAGS_EMOJIS } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "../../../common/utils.js";

/**
 * @typedef {Object} HeaderLink
 * @property {string | null} href
 * @property {string} [text]
 * @property {string} [image]
 * @property {string} [icon]
 * @property {boolean} showInHeader
 */

export class PackageHeader {
  static ExternalLinks = {
    socket: "https://socket.dev/npm/package/"
  };

  /**
   * @param {import("../package.js").PackageInfo} pkg
   */
  constructor(pkg) {
    this.package = pkg;
    this.nsn = this.package.nsn;
  }

  /**
   * @param {!DocumentFragment} clone
   * @returns {Record<string, HeaderLink>}
   */
  generate(clone) {
    const {
      name: packageName,
      version: packageVersion,
      description: packageDescription = "",
      licenses,
      flags
    } = this.package.dependencyVersion;

    const nameDomElement = /** @type {HTMLElement} */ (clone.querySelector(".name"));
    const versionDomElement = /** @type {HTMLElement} */ (clone.querySelector(".version"));
    const menuDomElement = /** @type {HTMLElement} */ (clone.querySelector(".info"));
    const descriptionDomElement = /** @type {HTMLElement} */ (clone.querySelector(".description"));
    const linksDomElement = /** @type {HTMLElement} */ (clone.querySelector(".links"));
    const flagsDomElement = /** @type {HTMLElement} */ (clone.querySelector(".flags"));

    // Name and Version
    nameDomElement.textContent = packageName;
    versionDomElement.textContent = `v${packageVersion}`;

    // Menu
    const menu = this.renderMenu(packageName);
    menuDomElement.insertAdjacentElement("afterend", menu);
    menuDomElement.addEventListener("click", () => {
      const menu = /** @type {HTMLElement} */ (/** @type {ParentNode} */ (menuDomElement.parentNode).querySelector(".info-menu"));
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
    const repositoryUrl = this.package.dependency.versions[packageVersion].links?.repository;
    const repositoryUrlHostname = repositoryUrl ? new URL(repositoryUrl).hostname : null;

    /** @type {Record<string, HeaderLink>} */
    const links = {
      npm: {
        href: this.package.dependency.versions[packageVersion].links?.npm ?? null,
        text: "NPM",
        image: "npm-icon.svg",
        showInHeader: true
      },
      homepage: {
        href: this.package.dependency.versions[packageVersion].links?.homepage ?? null,
        showInHeader: false
      },
      github: {
        href: repositoryUrl ?? null,
        text: "GitHub",
        image: "github-mark.png",
        showInHeader: repositoryUrlHostname === "github.com"
      },
      gitlab: {
        href: repositoryUrl ?? null,
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
      licenses: /** @type {any} */ (this.getLicenses(licenses))
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

  /**
   * @param {any[]} licenses
   * @returns {HeaderLink[]}
   */
  getLicenses(licenses) {
    /** @type {Record<string, HeaderLink>} */
    const licensesResult = Object.create(null);

    for (const license of licenses) {
      for (const [licenseName, licenseUrl] of Object.entries(license.licenses)) {
        if (licenseName in licensesResult) {
          continue;
        }
        licensesResult[licenseName] = {
          href: /** @type {string} */ (licenseUrl),
          text: licenseName.toLocaleUpperCase(),
          icon: "icon-vcard",
          showInHeader: true
        };
      }
    }

    return Object.values(licensesResult);
  }

  /**
   * @param {Record<string, HeaderLink>} links
   * @returns {DocumentFragment}
   */
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
            text: linkAttributes.text ?? null,
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
   * @returns {HTMLElement}
   */
  renderMenu(packageName) {
    const { socket } = PackageHeader.ExternalLinks;
    const i18n = utils.getI18n();
    const helpers = /** @type {Record<string, string>} */ (/** @type {unknown} */ (i18n.package_info.helpers));

    return utils.createDOMElement("div", {
      classList: ["info-menu", "hidden"],
      childs: [
        utils.createDOMElement("div", {
          text: helpers.thirdPartyTools,
          classList: ["info-menu-title"]
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

  /**
   * @param {string[]} flags
   * @returns {DocumentFragment | null}
   */
  renderFlags(flags) {
    const { warnings, deprecated } = this.package.dependencyVersion;
    const warningsLength = warnings.filter(
      (/** @type {{ kind: string }} */ warning) => !utils.getSettingsConfig().ignore.warnings.has(warning.kind)
    ).length;

    const textContent = getFlagsEmojisInlined(flags, new Set(utils.getSettingsConfig().ignore.flags));

    if (textContent === "") {
      return null;
    }

    const FLAGS = /** @type {Record<string, import("@nodesecure/flags").FlagDescriptor>} */ (
      /** @type {unknown} */ (this.package.nsn.secureDataSet.FLAGS)
    );
    const flagsMap = new Map(
      Object
        .entries(FLAGS)
        .map(([name, row]) => [row.emoji, { ...row, name }])
    );
    const segmenter = new Intl.Segmenter("en", {
      granularity: "grapheme"
    });
    const segitr = segmenter.segment(textContent.replaceAll(" ", ""));

    const fragment = document.createDocumentFragment();
    for (const icon of Array.from(segitr, ({ segment }) => segment)) {
      const flagEntry = flagsMap.get(icon);
      if (flagEntry) {
        const { name } = flagEntry;
        if (name === "warnings" && warningsLength === 0) {
          continue;
        }

        const htmlElement = createFlagInfoBulle(
          icon,
          name === "isDeprecated" ? (deprecated ?? "") : flagEntry.tooltipDescription
        );
        htmlElement.addEventListener("click", () => {
          const activeFlagEntry = /** @type {{ name: string }} */ (flagsMap.get(icon));

          window.wiki.header.setNewActiveView("flags");
          window.wiki.navigation.flags.setNewActiveMenu(activeFlagEntry.name);
          window.wiki.open();
        });

        fragment.appendChild(htmlElement);
      }
    }

    return fragment;
  }

  #hasDuplicate() {
    return this.package.dependencyVersion.flags.some((/** @type {string} */ title) => title === "hasDuplicate") &&
      !utils.getSettingsConfig().ignore.warnings.has("hasDuplicate") &&
      "isDuplicated" in FLAGS_EMOJIS;
  }

  /**
   * @param {DocumentFragment} clone
   */
  #renderHasDuplicateBtn(clone) {
    const hasDuplicateBtn = utils.createDOMElement("button",
      { classList: ["has-duplicate"], text: FLAGS_EMOJIS.isDuplicated });

    const packagesList = this.nsn.secureDataSet.findPackagesByName(this.package.dependencyVersion.name)
      .map((/** @type {{ name: string, version: string }} */ { name, version }) => `${name}@${version}`);

    hasDuplicateBtn.addEventListener("click", () => {
      const nodeIds = [...this.nsn.findNodeIds(new Set(packagesList))];
      this.nsn.highlightMultipleNodes(nodeIds);
      /** @type {import("../../locker/locker.js").Locker} */ (window.locker).lock();
    });

    const packageDescDiv = /** @type {HTMLElement} */ (clone.querySelector(".package-description"));
    packageDescDiv.appendChild(hasDuplicateBtn);
  }
}

/**
 * @param {string} text
 * @param {string} description
 */
function createFlagInfoBulle(text, description) {
  const spanElement = utils.createDOMElement("span", { text: description });

  return utils.createDOMElement("div", {
    classList: ["flag-infobulle"], text, childs: [spanElement]
  });
}
