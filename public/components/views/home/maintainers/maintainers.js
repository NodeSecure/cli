// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import { PopupTemplate } from "../../../popup/popup.js";
import "../../../expandable/expandable.js";

export class Maintainers {
  static whois(name, email) {
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

  constructor(secureDataSet, nsn, options = {}) {
    const { maximumMaintainers = 5 } = options;

    this.secureDataSet = secureDataSet;
    this.nsn = nsn;
    this.maximumMaintainers = maximumMaintainers;
  }

  render() {
    const authors = this.#highlightContacts([...this.secureDataSet.authors.entries()]
      .sort((left, right) => right[1].packages.size - left[1].packages.size));

    document.getElementById("authors-count").innerHTML = authors.length;
    const maintainers = document.querySelector(".home--maintainers");
    this.generate(authors, maintainers);
  }

  #highlightContacts(authors) {
    const highlightedAuthors = authors
      .filter(([_, contact]) => this.secureDataSet.isHighlighted(contact));

    const authorsRest = authors.filter(([_, contact]) => !this.secureDataSet.isHighlighted(contact));

    return [...highlightedAuthors, ...authorsRest];
  }

  generate(authors, maintainers) {
    const fragment = document.createDocumentFragment();
    const hideItems = authors.length > this.maximumMaintainers;

    for (let id = 0; id < authors.length; id++) {
      const [name, data] = authors[id];
      if (typeof name === "undefined") {
        continue;
      }
      const { packages, email, url = null } = data;

      const hasURL = typeof url === "string";
      const person = utils.createDOMElement("div", {
        className: "person",
        childs: [
          utils.createAvatarImageElementForAuthor(data),
          Maintainers.whois(name, email),
          hasURL ? utils.createDOMElement("i", { className: "icon-link" }) : null,
          utils.createDOMElement("div", {
            className: "packagescount",
            childs: [
              utils.createDOMElement("i", { className: "icon-cube" }),
              utils.createDOMElement("p", { text: packages.size })
            ]
          })
        ]
      });
      if (this.secureDataSet.isHighlighted(data)) {
        person.classList.add("highlighted");
      }
      if (hideItems && id >= this.maximumMaintainers) {
        person.classList.add("hidden");
      }
      person.addEventListener("click", () => {
        // TODO: close package info?
        window.popup.open(
          new PopupMaintainer(name, data, this.nsn).render()
        );
      });

      fragment.appendChild(person);
    }

    maintainers.appendChild(fragment);
    if (hideItems) {
      const expandableSpan = document.createElement("expandable-span");
      expandableSpan.onToggle = (expandable) => utils.toggle(expandable, maintainers, this.maximumMaintainers);

      maintainers.appendChild(expandableSpan);
    }
  }
}

export class PopupMaintainer {
  constructor(name, data, nsn) {
    this.name = name;
    this.data = data;
    this.nsn = nsn;
  }

  render() {
    const { email, url = null } = this.data;

    const templateElement = document.getElementById("maintainers-popup-template");
    /** @type {HTMLElement} */
    const clone = templateElement.content.cloneNode(true);

    clone.querySelector(".avatar").appendChild(
      utils.createAvatarImageElementForAuthor(this.data)
    );
    clone.querySelector(".name").textContent = this.name;
    const emailElement = clone.querySelector(".email");

    if (typeof email === "string") {
      emailElement.textContent = email;
    }
    else {
      emailElement.style.display = "none";
    }

    const linkElement = clone.querySelector(".icon-link");
    if (typeof url === "string") {
      linkElement.addEventListener("click", () => window.open(url, "_blank"));
    }
    else {
      linkElement.style.display = "none";
    }

    const globeElement = clone.querySelector(".icon-globe-alt-outline");
    const packagesList = [...this.data.packages]
      .map((spec) => {
        const { name, version } = utils.parseNpmSpec(spec);

        return `${name}@${version}`;
      });

    globeElement.addEventListener("click", () => {
      const nodeIds = [...this.nsn.findNodeIds(new Set(packagesList))];

      this.nsn.highlightMultipleNodes(nodeIds);
      window.locker.lock();
      window.popup.close();
      window.navigation.setNavByName("network--view");

      const currentSelectedNode = window.networkNav.currentNodeParams;
      const moveTo = currentSelectedNode === null || !nodeIds.includes(currentSelectedNode.nodes[0]);
      if (moveTo) {
        const origin = this.nsn.network.getViewPosition();
        const closestNode = nodeIds
          .map((id) => {
            return { id, pos: this.nsn.network.getPosition(id) };
          })
          .reduce(
            (a, b) => (utils.vec2Distance(origin, a.pos) < utils.vec2Distance(origin, b.pos) ? a : b)
          );

        const scale = nodeIds.length > 3 ? 0.25 : 0.35;
        this.nsn.network.focus(closestNode.id, {
          animation: true,
          scale
        });
      }
    });

    this.generatePackagesList(clone);

    return new PopupTemplate(
      "maintainer",
      clone
    );
  }

  /**
   * @param {!HTMLElement} clone
   */
  generatePackagesList(clone) {
    const fragment = document.createDocumentFragment();

    for (const spec of this.data.packages) {
      const { name, version } = utils.parseNpmSpec(spec);

      const iconNetwork = utils.createDOMElement("i", {
        className: "icon-right-open-big"
      });
      iconNetwork.addEventListener("click", () => {
        window.popup.close();
        window.navigation.setNavByName("network--view");
        setTimeout(() => this.nsn.focusNodeByNameAndVersion(name, version), 25);
      });

      fragment.appendChild(
        utils.createDOMElement("li", {
          childs: [
            utils.createDOMElement("p", { text: name }),
            utils.createDOMElement("span", { text: `v${version}` }),
            iconNetwork
          ]
        })
      );
    }

    clone.querySelector(".maintainers--packages")
      .appendChild(fragment);
  }
}
