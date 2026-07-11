// Import Third-party Dependencies
import * as documentationUI from "@nodesecure/documentation-ui";

// Import Internal Dependencies
import { PackageInfo } from "../package/package.js";

export class Wiki {
  /** @type {HTMLElement} */
  documentationRootElement;

  constructor() {
    const documentationRootElement = document.querySelector(
      "#documentation-root-element"
    );
    if (!documentationRootElement) {
      throw new Error("Wiki Documentation root element not found");
    }

    this.documentationRootElement = /** @type {HTMLElement} */ (documentationRootElement);
    const openButton = /** @type {HTMLElement} */ (this.documentationRootElement.querySelector(
      ".open-button"
    ));

    const documentationRenderContainer = /** @type {HTMLElement} */ (this.documentationRootElement.querySelector(
      ".documentation-render-container"
    ));
    for (const node of documentationRenderContainer.childNodes) {
      node.remove();
    }

    const { header, navigation } = documentationUI.render(
      documentationRenderContainer,
      { prefetch: true }
    );

    /** @type {documentationUI.RenderResult["header"]} */
    this.header = header;
    /** @type {documentationUI.RenderResult["navigation"]} */
    this.navigation = navigation;

    const packageInfoDomElement = /** @type {HTMLElement} */ (document.getElementById(PackageInfo.DOMElementName));
    document.addEventListener("click", (event) => {
      const isInWiki = this.documentationRootElement.contains(/** @type {Node} */ (event.target));
      const isInPackageInfo = packageInfoDomElement.contains(/** @type {Node} */ (event.target));

      if (!isInWiki && !isInPackageInfo && this.isOpen) {
        this.close();
      }
    });

    openButton.addEventListener("click", () => {
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
    const target = /** @type {HTMLElement} */ (event.target);
    const isTargetInput = target.tagName === "INPUT";
    const isTargetPopup = target.id === "popup--background";
    const isSearchCommandOpen = Boolean(document.querySelector("command-palette")?.open);
    if (isTargetInput || isTargetPopup || isSearchCommandOpen) {
      return;
    }

    const hotkeys = JSON.parse(/** @type {string} */ (localStorage.getItem("hotkeys")));

    if (event.key.toUpperCase() === hotkeys.wiki) {
      this[this.isOpen ? "close" : "open"]();
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  #keydownArrows(event) {
    const activeHeader = /** @type {HTMLElement} */ (this.header.active);
    const menuName = /** @type {string} */ (activeHeader.getAttribute("data-menu"));
    const activeNav = this.navigation[menuName];

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
