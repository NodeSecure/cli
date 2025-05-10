// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";

export class Files {
  constructor(pkg) {
    this.package = pkg;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    const { name, version, composition } = this.package.dependencyVersion;

    function onclick(_, fileName) {
      if (fileName === "../" || fileName === "./") {
        return;
      }

      const cleanedFile = fileName.startsWith("./") ? fileName.slice(2) : fileName;
      window
        .open(`https://unpkg.com/${name}@${version}/${cleanedFile}`, "_blank")
        .focus();
    }

    utils.createItemsList(
      clone.getElementById("extensions"),
      composition.extensions
    );

    utils.createItemsList(
      clone.getElementById("tarballfiles"),
      composition.files,
      { onclick, hideItems: true, hideItemsLength: 3 }
    );

    utils.createItemsList(
      clone.getElementById("minifiedfiles"),
      composition.minified,
      { onclick, hideItems: true }
    );

    utils.createItemsList(
      clone.getElementById("internaldep"),
      composition.required_files,
      {
        onclick,
        hideItems: true,
        hideItemsLength: 3
      }
    );
  }
}
