// Import Internal Dependencies
import * as utils from "../../common/utils";

export class Popup {
  constructor() {
    this.state = "closed";
    this.dom = {
      background: document.getElementById("popup--background"),
      popup: document.querySelector(".popup")
    };

    this.listener = null;
    this.templateName = null;
  }

  /**
   * @param {!PopupTemplate} htmlElement
   * @returns {void}
   */
  open(template) {
    if (!(template instanceof PopupTemplate)) {
      throw new Error("You must provide a PopupTemplate");
    }
    if (this.state === "open") {
      return;
    }

    this.templateName = template.name;
    this.dom.popup.appendChild(template.HTMLElement);
    // TODO: apply additional css customization

    this.dom.background.classList.add("show");
    this.state = "open";
    setTimeout(() => this.#closeOnClickOutside(), 1);
  }

  #closeOnClickOutside() {
    this.listener = utils.hideOnClickOutside(
      this.dom.popup,
      {
        reverse: true,
        hiddenTarget: null,
        callback: () => {
          this.listener = null;
          this.close();
        }
      }
    );
  }

  #cleanupClickOutside() {
    if (this.listener !== null) {
      document.removeEventListener("click", this.listener);
    }
  }

  close() {
    if (this.state === "closed") {
      return;
    }

    this.dom.popup.innerHTML = "";
    this.templateName = null;
    this.#cleanupClickOutside();
    this.dom.background.classList.remove("show");
    this.state = "closed";
  }
}

export class PopupTemplate {
  /**
   * @param {!string} name
   * @param {!HTMLElement} HTMLElement
   */
  constructor(
    name,
    HTMLElement
  ) {
    this.name = name;
    this.HTMLElement = HTMLElement;
  }
}
