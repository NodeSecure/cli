// Import Internal Dependencies
import * as utils from "../utils.js";

export class Navigation extends EventTarget {
  /**
  * @param {!string} name
  * @param {string} title
  * @param {string} icon
  * @returns {HTMLElement}
  */
  static createDOMElement(name, title = name, icon = "") {
    const childs = [
      utils.createDOMElement("p", { className: "description", text: name })
    ];
    if (icon !== "") {
      childs.unshift(utils.createDOMElement("p", { className: "icon", text: icon }));
    }

    return utils.createDOMElement("div", {
      className: "navigation--item",
      attributes: { "data-title": title },
      childs
    });
  }

  /**
   * @param {object} [options]
   * @param {boolean} [options.prefetch]
   * @param {(name: string, menu: HTMLElement) => any} [options.fetchCallback]
   * @param {string | null} [options.defaultName]
   */
  constructor(options = {}) {
    super();
    const { prefetch = false, fetchCallback = () => void 0, defaultName = null } = options;

    this.prefetch = prefetch;
    this.fetchCallback = fetchCallback;
    this.defaultName = defaultName;
    /** @type {HTMLElement} */
    this.active = null;
    /** @type {Map<string, HTMLElement>} */
    this.menus = new Map();
  }

  generateFromIterable(navigationItems) {
    const fragment = document.createDocumentFragment();

    for (const { name, title = name, icon = "" } of navigationItems) {
      const menu = Navigation.createDOMElement(name, title, icon);
      this.menus.set(name, menu);

      if (this.active === null && (this.defaultName === null || this.defaultName === name)) {
        this.setNewActiveMenu(name);
      }
      menu.addEventListener("click", () => this.setNewActiveMenu(name));

      fragment.appendChild(menu);
    }

    return fragment;
  }

  /**
   * @param {!string} name
   */
  setNewActiveMenu(name) {
    const domElement = this.menus.get(name);
    if (domElement.parentElement?.clientHeight < domElement.offsetTop + domElement.offsetHeight) {
      domElement.parentElement?.scrollTo({
        top: domElement.offsetTop,
        behavior: "smooth"
      });
    }
    else if (domElement.parentElement?.scrollTop > domElement.offsetTop) {
      domElement.parentElement?.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    if (domElement !== this.active) {
      if (this.active !== null) {
        this.active.classList.remove("active");
      }

      domElement.classList.add("active");
      this.active = domElement;

      this.fetchCallback(name, domElement);
      this.dispatchEvent(new CustomEvent("menuActivated", { detail: name }));
    }
  }

  next() {
    const next = this.active.nextElementSibling;
    if (next !== null) {
      this.setNewActiveMenu(next.querySelector(".description").innerHTML);
    }
  }

  previous() {
    const previous = this.active.previousElementSibling;
    if (previous !== null) {
      this.setNewActiveMenu(previous.querySelector(".description").innerHTML);
    }
  }
}
