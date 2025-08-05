// Import Third-party Dependencies
import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { currentLang } from "../../common/utils";
import "../icon/icon.js";

class Expandable extends LitElement {
  static styles = css`
span.expandable {
  display: flex;
  align-items: center !important;
  justify-content: center !important;
  height: 35px;
  font-size: 13px;
  font-family: mononoki;
  background: none;
  color: #00B0FF;
  text-shadow: 1px 1px 1px rgb(20 20 20 / 50%);
  transition: all 0.2s linear;
  margin-top: 5px;
}

span.expandable[data-value="opened"] {
  color: #F44336 !important;
}

span.expandable:hover {
  cursor: pointer;
}

span.expandable nsecure-icon {
  margin-right: 4px;
  margin-top: 1px;
}
`;
  static properties = {
    onToggle: { type: Function },
    isClosed: { type: Boolean }
  };

  constructor() {
    super();
    this.isClosed = false;
    this.onToggle = () => void 0;
  }

  render() {
    const lang = currentLang();

    return html`
      <span data-value=${this.isClosed ? "opened" : "closed"}  @click=${this.#handleClick} class="expandable">
        ${when(this.isClosed,
          () => html`<nsecure-icon name="minus"></nsecure-icon>
        <p>${window.i18n[lang].home.showLess}</p>`,
          () => html`<nsecure-icon name="plus"></nsecure-icon>
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
