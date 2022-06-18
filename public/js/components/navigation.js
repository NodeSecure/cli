// Import Internal Dependencies
import { PackageInfo } from "./package.info.js";

export class ViewNavigation {
  static DefaultActiveMenu = "network--view";

  constructor() {
    this.activeMenu = null;
    this.menus = new Map();

    const navElements = document.querySelectorAll("#view-navigation li");
    for (const navigationMenu of navElements) {
      const menuName = navigationMenu.getAttribute("data-menu");
      this.menus.set(menuName, navigationMenu);

      if (menuName === ViewNavigation.DefaultActiveMenu) {
        this.setNewActiveMenu(navigationMenu);
      }

      navigationMenu.addEventListener("click", () => this.onNavigationSelected(navigationMenu));
    }

    document.addEventListener("keydown", (event) => {
      if (window.searchbar.background.classList.contains("show")) {
        return;
      }

      switch(event.code) {
        case "KeyH": {
          this.onNavigationSelected(this.menus.get("home--view"));
          break;
        }
        case "KeyN": {
          this.onNavigationSelected(this.menus.get("network--view"));
          break;
        }
        case "KeyS": {
          this.onNavigationSelected(this.menus.get("settings--view"));
          break;
        }
      }
    });
  }

  setNavByName(navName) {
    this.onNavigationSelected(this.menus.get(navName));
  }

  /**
   * @param {!HTMLElement} selectedNav
   */
  setNewActiveMenu(selectedNav) {
    const menuName = selectedNav.getAttribute("data-menu");

    document.getElementById(menuName).classList.remove("hidden");
    selectedNav.classList.add("active");

    this.activeMenu = selectedNav;
  }

  disableActiveMenu() {
    const menuName = this.activeMenu.getAttribute("data-menu");
    const view = document.getElementById(menuName);

    this.activeMenu.classList.remove("active");
    view.classList.add("hidden");
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
}
