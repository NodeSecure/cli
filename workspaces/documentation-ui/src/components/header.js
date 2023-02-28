// Import Internal Dependencies
import * as utils from "../utils.js";

export class Header {
  constructor(menu, options = {}) {
    const { defaultName = null } = options;

    this.active = null;
    this.defaultName = defaultName;

    /** @type {Map<string, HTMLElement>} */
    this.views = new Map();

    const title = utils.createDOMElement("div", {
      className: "title",
      childs: [
        utils.createDOMElement("img", {
          attributes: {
            src: "https://cdn.discordapp.com/attachments/850363535568928768/962763278663188520/Logo_sans_fond2x.png"
          }
        }),
        utils.createDOMElement("p", { text: "NodeSecure wiki" })
      ]
    });

    const ul = utils.createDOMElement("ul", {
      childs: [
        ...menu.map((item) => {
          return utils.createDOMElement("li", {
            text: item.name,
            attributes: { "data-menu": item.title }
          });
        })
      ]
    });

    for (const liElement of ul.children) {
      const name = liElement.getAttribute("data-menu");
      this.views.set(name, liElement);

      if (this.active === null && (this.defaultName === null || this.defaultName === name)) {
        setTimeout(() => this.setNewActiveView(name), 1);
      }

      liElement.addEventListener("click", () => this.setNewActiveView(name));
    }

    this.dom = utils.createDOMElement("div", {
      className: "documentation--header",
      childs: [title, ul]
    });
  }

  /**
   * @param {!string} name
   */
  setNewActiveView(name) {
    const liElement = this.views.get(name);

    if (liElement !== this.active) {
      if (this.active !== null) {
        this.active.classList.remove("active");
        const current = document.querySelector(`.documentation--${this.active.getAttribute("data-menu")}`);
        current.style.display = "none";
      }

      liElement.classList.add("active");
      const target = document.querySelector(`.documentation--${name}`);
      target.style.display = "flex";

      this.active = liElement;
    }
  }
}
