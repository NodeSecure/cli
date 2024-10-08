// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import { createFileBox } from "../../../file-box/file-box.js";

export class Licenses {
  constructor(pkg) {
    this.package = pkg;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    clone.getElementById("pan-licenses")
      .appendChild(this.renderLicenses());
  }

  renderLicenses() {
    const { licenses } = this.package.dependencyVersion;
    const fragment = document.createDocumentFragment();
    const unpkgRoot = this.package.links.unpkg.href;
    const processedLicenses = new Set();

    for (const license of licenses) {
      const [licenseName, licenseLink] = Object.entries(license.licenses)[0];
      if (processedLicenses.has(licenseName)) {
        continue;
      }
      processedLicenses.add(licenseName);

      const spdx = Object.entries(license.spdx)
        .map(([key, value]) => `${value ? "✔️" : "❌"} ${key}`);

      const boxContainer = utils.createDOMElement("div", {
        classList: ["box-container-licenses"],
        childs: spdx.map((text) => utils.createDOMElement("div", { text }))
      });

      const box = createFileBox({
        title: licenseName,
        fileName: license.from,
        childs: [boxContainer],
        titleHref: licenseLink,
        fileHref: `${unpkgRoot}${license.from}`
      });
      fragment.appendChild(box);
    }

    return fragment;
  }
}
