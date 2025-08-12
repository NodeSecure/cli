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
    /** @type {documentationUI.Header} */
    this.header = header;
    /** @type {Record<string, documentationUI.Navigation>} */
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
      this.#keydownHotkeys(event);
      if (this.isOpen) {
        this.#keydownArrows(event);
      }
    });
  }

  /**
   * @param {KeyboardEvent} event
   */
  #keydownHotkeys(event) {
    const isTargetInput = event.target.tagName === "INPUT";
    const isTargetPopup = event.target.id === "popup--background";
    if (isTargetInput || isTargetPopup) {
      return;
    }

    const hotkeys = JSON.parse(localStorage.getItem("hotkeys"));

    if (event.key.toUpperCase() === hotkeys.wiki) {
      this[this.isOpen ? "close" : "open"]();
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  #keydownArrows(event) {
    /** @type {documentationUI.Navigation} */
    const activeNav = this.navigation[this.header.active.getAttribute("data-menu")];

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
        this.header.switchActiveView();
        break;
      case "ArrowUp":
        activeNav.previous();
        break;
      case "ArrowDown":
        activeNav.next();
        break;
      default:
        break;
    }
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
