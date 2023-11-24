// Import Internal Dependencies
import * as utils from "../../../utils.js";

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
    const { license: packageLicense } = this.package.dependencyVersion;

    const fragment = document.createDocumentFragment();
    if (typeof packageLicense === "string") {
      return fragment;
    }

    const unpkgRoot = this.package.links.unpkg.href;
    for (const license of packageLicense.licenses) {
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
        fileHref: `${unpkgRoot}${license.from}`
      });
      fragment.appendChild(box);
    }

    return fragment;
  }
}
