// Import Third-party Dependencies
import * as documentationUI from "@nodesecure/documentation-ui";

// Import Internal Dependencies
import { PackageInfo } from "../package/package.js";

export class Wiki {
  constructor() {
    this.documentationRootElement = document.querySelector("#documentation-root-element");
    this.documentationRenderContainer = this.documentationRootElement.querySelector(".documentation-render-container");
    this.openButton = this.documentationRootElement.querySelector(".open-button");

    const { header, navigation } = documentationUI.render(
      this.documentationRenderContainer, { preCacheAllFlags: true }
    );
    this.header = header;
    this.navigation = navigation;

    const packageInfoDomElement = document.getElementById(PackageInfo.DOMElementName);
    document.addEventListener("click", (event) => {
      const isInWiki = this.documentationRootElement.contains(event.target);
      const isInPackageInfo = packageInfoDomElement.contains(event.target);

      if (!isInWiki && !isInPackageInfo && this.isOpen) {
        this.close();
      }
    });

    this.openButton.addEventListener("click", () => {
      this[this.isOpen ? "close" : "open"]();
    });

    document.addEventListener("keydown", (event) => {
      const hotkeys = JSON.parse(localStorage.getItem("hotkeys"));

      if (event.key.toUpperCase() === hotkeys.wiki) {
        this[this.isOpen ? "close" : "open"]();
      }
    });
  }

  get isOpen() {
    return this.documentationRootElement.classList.contains("slide-in");
  }

  open() {
    if (!this.isOpen) {
      this.documentationRootElement.classList.remove("slide-out-documentation");
      this.documentationRootElement.classList.add("slide-in");
    }
  }

  close() {
    if (this.isOpen) {
      this.documentationRootElement.classList.remove("slide-in");
      this.documentationRootElement.classList.add("slide-out-documentation");
    }
  }
}
