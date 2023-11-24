// Import Internal Dependencies
import * as utils from "../../../utils.js";

export class Vulnerabilities {
  static href = { target: "_blank", rel: "noopener noreferrer" };

  constructor(pkg) {
    this.package = pkg;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  setStrategy(clone) {
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
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    this.setupSignal(clone);
    this.setStrategy(clone);

    clone.querySelector(".packages-vuln")
      .appendChild(this.renderVulnerabilies());
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  setupSignal(clone) {
    const { vulnerabilities } = this.package.dependency;
    this.package.addNavigationSignal(
      clone.getElementById("vulnerabilities-nav-menu"),
      vulnerabilities.length
    );
  }

  renderVulnerabilies() {
    const { vulnerabilities } = this.package.dependency;

    const fragment = document.createDocumentFragment();
    for (const vuln of vulnerabilities) {
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
            attributes: { href: vuln.url, ...Vulnerabilities.href }
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
}
