// Import Third-party Dependencies
import { LitElement, html } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { currentLang } from "../../common/utils";

class Expandable extends LitElement {
  static properties = {
    onToggle: { type: Function },
    isClosed: { type: Boolean }
  };

  constructor() {
    super();
    this.isClosed = false;
    this.onToggle = () => void 0;
  }

  // FIXME: must opt out from the shadow DOM for now because of to be able to apply CSS from fontello
  createRenderRoot() {
    return this;
  }

  render() {
    const lang = currentLang();

    return html`
      <span data-value=${this.isClosed ? "opened" : "closed"}  @click=${this.#handleClick} class="expandable">
        ${when(this.isClosed,
          () => html`<i class="icon-minus-squared-alt"></i>
        <p>${window.i18n[lang].home.showLess}</p>`,
          () => html`<i class="icon-plus-squared-alt"></i>
        <p>${window.i18n[lang].home.showMore}</p>`
        )}
      </span>
`;
  }

  #handleClick() {
    this.onToggle(this);
  }
}

customElements.define("expandable-span", Expandable);
