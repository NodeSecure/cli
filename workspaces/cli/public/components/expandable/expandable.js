// Import Third-party Dependencies
import { LitElement, html, css } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { currentLang } from "../../common/utils";
import "../icon/icon.js";

/**
 * @typedef {Record<string, { home: { showMore: string, showLess: string } }>} I18nLanguage
 */

/**
 * "Expandable" web component displaying a toggle button with an icon.
 * @element expandable-span
 * @prop {Function} onToggle - Function called during the interaction (default: () => void 0).
 * @prop {boolean} isClosed - Specifies whether the associated content is hidden (true) or visible (false).
 */
export class Expandable extends LitElement {
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
    this.isClosed = true;
    /** @type {(instance: Expandable) => void} */
    this.onToggle = () => void {};
  }

  render() {
    const lang = currentLang();
    const i18n =
      /** @type I18nLanguage */
      (window.i18n);
    const translations = i18n[lang].home;

    return html`
      <span data-value=${this.isClosed ? "closed" : "opened"}  @click=${this.#handleClick} class="expandable">
        ${when(this.isClosed,
          () => html`<nsecure-icon name="plus"></nsecure-icon>
        <p>${translations.showMore}</p>`,
          () => html`<nsecure-icon name="minus"></nsecure-icon>
        <p>${translations.showLess}</p>`
        )}
      </span>
`;
  }

  #handleClick() {
    this.onToggle(this);
  }
}

customElements.define("expandable-span", Expandable);
/**
* @typedef {import('./expandable.js').Expandable} ExpandableType
*/
