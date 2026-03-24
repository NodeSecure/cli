// Import Internal Dependencies
import * as utils from "../utils.ts";

export interface HeaderMenuItem {
  name: string;
  title: string;
}

export interface HeaderOptions {
  defaultName?: string | null;
}

export class Header {
  active: HTMLElement | null;
  defaultName: string | null;
  views: Map<string, HTMLElement>;
  dom: HTMLElement;

  constructor(
    menu: HeaderMenuItem[],
    options: HeaderOptions = {}
  ) {
    const { defaultName = null } = options;

    this.active = null;
    this.defaultName = defaultName;
    this.views = new Map();

    const title = utils.createDOMElement("div", {
      className: "title",
      childs: [
        utils.createDOMElement("img", {
          attributes: {
            src: "https://static.thenounproject.com/png/3946692-200.png"
          }
        }),
        utils.createDOMElement("p", { text: "NodeSecure wiki" })
      ]
    });

    const ul = utils.createDOMElement("ul", {
      childs: [
        ...menu.map((item) => utils.createDOMElement("li", {
          text: item.name,
          attributes: { "data-menu": item.title }
        }))
      ]
    });

    for (const liElement of ul.children) {
      const name = liElement.getAttribute("data-menu")!;
      this.views.set(name, liElement as HTMLElement);

      if (
        this.active === null &&
        (this.defaultName === null || this.defaultName === name)
      ) {
        setTimeout(() => this.setNewActiveView(name), 1);
      }

      liElement.addEventListener(
        "click",
        () => this.setNewActiveView(name)
      );
    }

    this.dom = utils.createDOMElement("div", {
      className: "documentation--header",
      childs: [title, ul]
    });
  }

  setNewActiveView(
    name: string
  ): void {
    const liElement = this.views.get(name)!;

    if (liElement !== this.active) {
      if (this.active !== null) {
        this.active.classList.remove("active");
        const current = document.querySelector<HTMLElement>(
          `.documentation--${this.active.getAttribute("data-menu")}`
        )!;
        current.style.display = "none";
      }

      liElement.classList.add("active");
      const target = document.querySelector<HTMLElement>(
        `.documentation--${name}`
      )!;
      target.style.display = "flex";

      this.active = liElement;
    }
  }

  switchActiveView(): void {
    const next = this.active!.nextElementSibling;
    if (next === null) {
      const first = this.active!.parentElement!.firstElementChild!;
      this.setNewActiveView(first.getAttribute("data-menu")!);
    }
    else {
      this.setNewActiveView(next.getAttribute("data-menu")!);
    }
  }
}
