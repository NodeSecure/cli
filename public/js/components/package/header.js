// Import Third-party Dependencies
import { getFlagsEmojisInlined } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "../../utils.js";

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
      description: packageDescription,
      license,
      repository,
      flags
    } = this.package.dependencyVersion;

    const [nameDomElement, versionDomElement, descriptionDomElement, linksDomElement, flagsDomElement] = [
      clone.querySelector(".name"),
      clone.querySelector(".version"),
      clone.querySelector(".package-description"),
      clone.querySelector(".package-links"),
      clone.querySelector(".package-flags")
    ]

    // Name and Version
    nameDomElement.textContent = packageName;
    if (packageName.length >= 18) {
      nameDomElement.classList.add("lowsize");
    }
    versionDomElement.textContent = `v${packageVersion}`;

    // Description
    const description = packageDescription.trim();
    if (description === "") {
      descriptionDomElement.style.display = "none";
    }
    else {
      descriptionDomElement.textContent = description;
    }

    // Links
    const packageHomePage = this.package.dependency.metadata.homepage || null;
    const packageGithubPage = utils.parseRepositoryUrl(
      repository,
      packageHomePage !== null && new URL(packageHomePage).hostname === "github.com" ? packageHomePage : null
    );

    const hasNoLicense = license === "unkown license";
    const links = {
      npm: {
        href: `https://www.npmjs.com/package/${packageName}/v/${packageVersion}`,
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
        href: `https://unpkg.com/${packageName}@${packageVersion}/`,
        text: "Unpkg",
        icon: "icon-cubes",
        showInHeader: true
      },
      license: {
        href: hasNoLicense ? "#" : (license.licenses[0]?.spdxLicenseLinks[0] ?? "#"),
        text: hasNoLicense ? "unkown" : license.uniqueLicenseIds.join(", ").toUpperCase(),
        icon: "icon-vcard",
        showInHeader: true
      },
      thirdParty: {
        menu: this.renderToolsMenu(packageName),
        text: 'Tools',
        icon: 'icon-link',
        showInHeader: true
      }
    };
    linksDomElement.appendChild(this.renderLinks(links));

    // Flags
    const flagFragment = this.renderFlags(flags);
    if (flagFragment) {
      flagsDomElement.appendChild(flagFragment);
    }
    else {
      flagsDomElement.style.display = "none";
    }

    return links;
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

      const linksChildren = [
        linkImageOrIcon,
      ];
      if (linkAttributes.menu) {
        linksChildren.push(
          utils.createDOMElement("div", {
            classList: ['package-info-header-menu'],
            childs: linkAttributes.menu
          })
        );
      }
      else {
        linksChildren.push(
          utils.createDOMElement("a", {
            text: linkAttributes.text,
            attributes: {
              href: linkAttributes.href,
              target: "_blank",
              rel: "noopener noreferrer"
            }
          })
        );
      }

      fragment.appendChild(utils.createDOMElement("div", {
        className: "link", childs: linksChildren
      }));
    }

    return fragment;
  }

  /**
   * @param {!string} packageName
   * @returns {HTMLElement[]}
   */
  renderToolsMenu(packageName) {
    const { snykAdvisor, socket } = PackageHeader.ExternalLinks;

    return [
      utils.createDOMElement('span', { text: 'Tools' }),
      utils.createDOMElement('div', {
        classList: ['tools-menu'],
        childs: [
          utils.createDOMElement('a', {
            text: 'Snyk',
            attributes: {
              href: snykAdvisor + packageName,
              target: "_blank",
            }
          }),
          utils.createDOMElement('a', {
            text: 'Socket.dev',
            attributes: {
              href: socket + packageName,
              target: "_blank",
            }
          })
        ]
      })
    ]
  }

  renderFlags(flags) {
    const textContent = getFlagsEmojisInlined(flags, new Set(window.settings.config.ignore.flags));

    if (textContent === "") {
      return null;
    }

    const flagsMap = new Map(
      Object
        .entries(this.package.nsn.secureDataSet.FLAGS)
        .map(([name, row]) => [row.emoji, { ...row, name }])
    );

    const fragment = document.createDocumentFragment();
    for (const icon of textContent) {
      if (flagsMap.has(icon)) {
        const tooltipElement = utils.createTooltip(icon, flagsMap.get(icon).tooltipDescription);
        tooltipElement.addEventListener("click", () => {
          const { name } = flagsMap.get(icon);

          wiki.header.setNewActiveView("flags");
          wiki.navigation.flags.setNewActiveMenu(name);
          wiki.open();
        });

        fragment.appendChild(tooltipElement);
      }
    }

    return fragment;
  }
}
