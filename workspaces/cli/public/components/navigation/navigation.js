// Import Internal Dependencies
import { PackageInfo } from "../package/package.js";
import { EVENTS } from "../../core/events.js";

// CONSTANTS
const kAvailableView = new Set([
  "network--view",
  "home--view",
  "search--view",
  "settings--view",
  "tree--view",
  "warnings--view"
]);

export class ViewNavigation {
  static DefaultActiveMenu = "network--view";

  constructor() {
    /** @type {HTMLElement | null} */
    this.activeMenu = null;
    /** @type {Map<string, HTMLElement>} */
    this.menus = new Map();

    const defaultMenu = this.getAnchor();
    const navElements = document.querySelectorAll("#view-navigation li");
    for (const navigationMenu of navElements) {
      const menuName = navigationMenu.getAttribute("data-menu");
      if (!menuName) {
        continue;
      }
      this.menus.set(menuName, /** @type {HTMLElement} */ (navigationMenu));

      if (menuName === defaultMenu) {
        this.setNewActiveMenu(/** @type {HTMLElement} */ (navigationMenu));
      }

      navigationMenu.addEventListener("click", () => this.onNavigationSelected(/** @type {HTMLElement} */ (navigationMenu)));
    }

    document.addEventListener("keydown", (event) => {
      const wikiRoot = /** @type {HTMLElement} */ (document.getElementById("documentation-root-element"));
      const isWikiOpen = wikiRoot.classList.contains("slide-in");
      const eventTarget = /** @type {HTMLElement} */ (event.target);
      const isTargetPopup = eventTarget.id === "popup--background";
      const isPopupOpened = document.querySelector("#popup--background.show");
      const isTargetInput = eventTarget.tagName === "INPUT";
      const isSearchCommandOpen = Boolean(document.querySelector("command-palette")?.open);
      if (isTargetPopup || isWikiOpen || isTargetInput || isPopupOpened || isSearchCommandOpen) {
        return;
      }

      const hotkeys = JSON.parse(/** @type {string} */ (localStorage.getItem("hotkeys")));
      switch (event.key.toUpperCase()) {
        case hotkeys.home: {
          this.onNavigationSelected(/** @type {HTMLElement} */ (this.menus.get("home--view")));
          break;
        }
        case hotkeys.network: {
          this.onNavigationSelected(/** @type {HTMLElement} */ (this.menus.get("network--view")));
          break;
        }
        case hotkeys.settings: {
          this.onNavigationSelected(/** @type {HTMLElement} */ (this.menus.get("settings--view")));
          break;
        }
        case hotkeys.search: {
          this.onNavigationSelected(/** @type {HTMLElement} */ (this.menus.get("search--view")));
          break;
        }
        case hotkeys.tree: {
          this.onNavigationSelected(/** @type {HTMLElement} */ (this.menus.get("tree--view")));
          break;
        }
        case hotkeys.warnings: {
          this.onNavigationSelected(/** @type {HTMLElement} */ (this.menus.get("warnings--view")));
          break;
        }
      }
    });
  }

  /**
   * @param {string} navName
   */
  setNavByName(navName) {
    const selectedNav = this.menus.get(navName);
    if (!selectedNav) {
      return;
    }
    this.onNavigationSelected(selectedNav);
  }

  /**
   * @param {!HTMLElement} selectedNav
   */
  setNewActiveMenu(selectedNav) {
    const menuName = /** @type {string} */ (selectedNav.getAttribute("data-menu"));

    /** @type {HTMLElement} */ (document.getElementById(menuName)).classList.remove("hidden");
    selectedNav.classList.add("active");
    this.setAnchor(menuName);

    this.activeMenu = selectedNav;

    if (menuName === "network--view") {
      window.dispatchEvent(new CustomEvent(EVENTS.NETWORK_VIEW_SHOWED, { composed: true }));
    }
  }

  disableActiveMenu() {
    const activeMenu = /** @type {HTMLElement} */ (this.activeMenu);
    const menuName = /** @type {string} */ (activeMenu.getAttribute("data-menu"));
    const view = /** @type {HTMLElement} */ (document.getElementById(menuName));

    activeMenu.classList.remove("active");
    view.classList.add("hidden");

    if (menuName === "network--view") {
      window.dispatchEvent(new CustomEvent(EVENTS.NETWORK_VIEW_HID, { composed: true }));
    }
  }

  /**
   * @returns {string}
   */
  getAnchor() {
    const documentURL = new URL(document.URL);
    const anchorName = documentURL.searchParams.get("view") ?? ViewNavigation.DefaultActiveMenu;

    return kAvailableView.has(anchorName) ? anchorName : ViewNavigation.DefaultActiveMenu;
  }

  /**
   * @param {string} anchorName
   */
  setAnchor(anchorName) {
    const newDocumentURL = new URL(document.URL);
    newDocumentURL.searchParams.set("view", anchorName);

    window.history.replaceState(null, "", newDocumentURL);
  }

  /**
   * @param {!HTMLElement} selectedNav
   */
  onNavigationSelected(selectedNav) {
    if (!selectedNav.classList.contains("active")) {
      PackageInfo.close();

      this.disableActiveMenu();
      this.setNewActiveMenu(selectedNav);
    }
  }

  /**
   * @param {string} menuName
   */
  hideMenu(menuName) {
    const menu = this.menus.get(menuName);
    if (!menu) {
      return;
    }

    if (menuName === "network--view") {
      window.dispatchEvent(new CustomEvent(EVENTS.NETWORK_VIEW_HID, { composed: true }));
    }

    menu.classList.add("hidden");
  }

  /**
   * @param {string} menuName
   */
  showMenu(menuName) {
    const menu = this.menus.get(menuName);
    if (!menu) {
      return;
    }

    if (menuName === "network--view") {
      window.dispatchEvent(new CustomEvent(EVENTS.NETWORK_VIEW_SHOWED, { composed: true }));
    }

    menu.classList.remove("hidden");
  }
}
