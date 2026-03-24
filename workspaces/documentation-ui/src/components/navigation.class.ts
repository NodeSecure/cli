// Import Internal Dependencies
import * as utils from "../utils.ts";

export interface NavigationItem {
  name: string;
  title?: string;
  icon?: string;
}

export interface NavigationOptions {
  prefetch?: boolean;
  fetchCallback?: (name: string, menu: HTMLElement) => any;
  defaultName?: string | null;
}

export class Navigation extends EventTarget {
  prefetch: boolean;
  fetchCallback: (name: string, menu: HTMLElement) => any;
  defaultName: string | null;
  active: HTMLElement | null;
  menus: Map<string, HTMLElement>;

  static createDOMElement(
    name: string,
    title: string = name,
    icon: string = ""
  ): HTMLElement {
    const childs = [
      utils.createDOMElement("p", { className: "description", text: name })
    ];
    if (icon !== "") {
      childs.unshift(
        utils.createDOMElement("p", { className: "icon", text: icon })
      );
    }

    return utils.createDOMElement("div", {
      className: "navigation--item",
      attributes: { "data-title": title },
      childs
    });
  }

  constructor(
    options: NavigationOptions = {}
  ) {
    super();
    const {
      prefetch = false,
      fetchCallback = () => void 0,
      defaultName = null
    } = options;

    this.prefetch = prefetch;
    this.fetchCallback = fetchCallback;
    this.defaultName = defaultName;
    this.active = null;
    this.menus = new Map();
  }

  generateFromIterable(
    navigationItems: Iterable<NavigationItem>
  ): DocumentFragment {
    const fragment = document.createDocumentFragment();
    let initialScheduled = false;

    for (const { name, title = name, icon = "" } of navigationItems) {
      const menu = Navigation.createDOMElement(
        name, title, icon
      );
      this.menus.set(name, menu);

      if (
        !initialScheduled &&
        (this.defaultName === null || this.defaultName === name)
      ) {
        initialScheduled = true;
        setTimeout(() => this.setNewActiveMenu(name), 1);
      }
      menu.addEventListener(
        "click",
        () => this.setNewActiveMenu(name)
      );

      fragment.appendChild(menu);
    }

    return fragment;
  }

  setNewActiveMenu(name: string): void {
    const domElement = this.menus.get(name)!;
    if (
      domElement.parentElement !== null &&
      domElement.parentElement.clientHeight < domElement.offsetTop + domElement.offsetHeight
    ) {
      domElement.parentElement.scrollTo({
        top: domElement.offsetTop,
        behavior: "smooth"
      });
    }
    else if (
      domElement.parentElement !== null &&
      domElement.parentElement.scrollTop > domElement.offsetTop
    ) {
      domElement.parentElement.scrollTo({
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

  next(): void {
    const next = this.active!.nextElementSibling;
    if (next !== null) {
      this.setNewActiveMenu(next.querySelector(".description")!.innerHTML);
    }
  }

  previous(): void {
    const previous = this.active!.previousElementSibling;
    if (previous !== null) {
      this.setNewActiveMenu(previous.querySelector(".description")!.innerHTML);
    }
  }
}
