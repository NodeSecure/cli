// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";

// Import Internal Dependencies
import { EVENTS } from "../../core/events.js";
import { currentLang } from "../../common/utils.js";

class NetworkBreadcrumb extends LitElement {
  static styles = css`
    :host {
      --breadcrumb-bg: var(--primary);
      --breadcrumb-shadow: 2px 1px 10px rgb(38 16 127 / 48%);
      --breadcrumb-dropdown-bg: var(--primary-darker);
      --breadcrumb-dropdown-border: rgb(255 255 255 / 20%);
      --breadcrumb-dropdown-hover: rgb(255 255 255 / 15%);
      --breadcrumb-header-color: rgb(255 255 255 / 50%);
      --breadcrumb-separator-bg: rgb(255 255 255 / 15%);

      position: absolute;
      top: 8px;
      left: 10px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--breadcrumb-bg);
      box-shadow: var(--breadcrumb-shadow);
      border-radius: 6px;
      padding: 4px 10px;
      font-family: mononoki, monospace;
      font-size: 12px;
      color: #fff;
    }

    :host-context(body.dark) {
      --breadcrumb-bg: rgb(10 10 20 / 72%);
      --breadcrumb-shadow: none;
      --breadcrumb-dropdown-bg: rgb(10 10 20 / 95%);
      --breadcrumb-dropdown-border: rgb(255 255 255 / 15%);
      --breadcrumb-dropdown-hover: rgb(255 255 255 / 10%);
      --breadcrumb-header-color: rgb(255 255 255 / 40%);
      --breadcrumb-separator-bg: rgb(255 255 255 / 10%);
    }

    :host([hidden]) {
      display: none !important;
    }

    button {
      background: transparent;
      border: none;
      color: rgb(255 255 255 / 85%);
      cursor: pointer;
      font-family: mononoki, monospace;
      font-size: 12px;
      padding: 0;
    }

    button:hover {
      color: #fff;
      text-decoration: underline;
    }

    .separator-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .separator {
      opacity: 0.5;
      cursor: default;
      text-decoration: none !important;
    }

    .separator.has-siblings {
      cursor: pointer;
      opacity: 0.8;
    }

    .separator.has-siblings:hover {
      opacity: 1;
      color: var(--secondary);
      text-decoration: none;
    }

    .active {
      color: var(--secondary);
      font-weight: bold;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      background: var(--breadcrumb-dropdown-bg);
      border: 1px solid var(--breadcrumb-dropdown-border);
      border-radius: 6px;
      padding: 4px 0;
      overflow-y: auto;
      z-index: 30;
      box-shadow: 0 4px 16px rgb(0 0 0 / 50%);
    }

    .dropdown button {
      display: block;
      width: 100%;
      text-align: left;
      padding: 5px 12px;
      white-space: nowrap;
      color: rgb(255 255 255 / 80%);
      font-size: 11px;
      border-radius: 0;
    }

    .dropdown button:hover {
      background: var(--breadcrumb-dropdown-hover);
      color: #fff;
      text-decoration: none;
    }

    .dropdown-header {
      display: block;
      padding: 4px 12px 3px;
      font-size: 10px;
      color: var(--breadcrumb-header-color);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: default;
    }

    .dropdown-separator {
      height: 1px;
      background: var(--breadcrumb-separator-bg);
      margin: 3px 0 4px;
    }

    .root-switcher-wrapper {
      position: static;
    }

    .root-switcher {
      opacity: 0.55;
      font-size: 11px;
      padding: 0 3px;
    }

    .root-switcher:hover {
      opacity: 1;
      text-decoration: none;
    }

    .root-entry {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .root-label {
      color: rgb(255 255 255 / 85%);
    }

    .remove-btn {
      opacity: 0.3;
      font-size: 14px;
      line-height: 1;
      padding: 0 1px;
    }

    .remove-btn:hover {
      opacity: 1;
      color: #ff6b6b;
      text-decoration: none;
    }
  `;

  static properties = {
    root: { type: Object },
    stack: { type: Array },
    siblings: { type: Array },
    packages: { type: Array },
    _openDropdown: { state: true },
    _rootSwitcherOpen: { state: true }
  };

  constructor() {
    super();
    this.root = null;
    this.stack = [];
    this.siblings = [];
    this.packages = [];
    this._openDropdown = null;
    this._rootSwitcherOpen = false;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this.#handleDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this.#handleDocumentClick);
  }

  updated() {
    this.hidden = this.root === null;
  }

  #handleDocumentClick = () => {
    if (this._openDropdown !== null) {
      this._openDropdown = null;
    }

    if (this._rootSwitcherOpen) {
      this._rootSwitcherOpen = false;
    }
  };

  #handleReset() {
    this.dispatchEvent(new CustomEvent(EVENTS.DRILL_RESET, {
      bubbles: true,
      composed: true
    }));
  }

  #handleBack(index) {
    this.dispatchEvent(new CustomEvent(EVENTS.DRILL_BACK, {
      detail: { index },
      bubbles: true,
      composed: true
    }));
  }

  #toggleDropdown(index, event) {
    event.stopPropagation();

    this._openDropdown = this._openDropdown === index ? null : index;
  }

  #handleSiblingClick(stackIndex, nodeId, event) {
    event.stopPropagation();

    this._openDropdown = null;
    this.dispatchEvent(new CustomEvent(EVENTS.DRILL_SWITCH, {
      detail: { stackIndex, nodeId },
      bubbles: true,
      composed: true
    }));
  }

  #toggleRootSwitcher(event) {
    event.stopPropagation();

    this._rootSwitcherOpen = !this._rootSwitcherOpen;
  }

  #handleRootSwitch(spec, event) {
    event.stopPropagation();

    this._rootSwitcherOpen = false;
    this.dispatchEvent(new CustomEvent(EVENTS.ROOT_SWITCH, {
      detail: { spec },
      bubbles: true,
      composed: true
    }));
  }

  #handleRootRemove(event) {
    event.stopPropagation();

    this.dispatchEvent(new CustomEvent(EVENTS.ROOT_REMOVE, {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (this.root === null) {
      return nothing;
    }

    const otherPackages = this.packages ?? [];
    const isInDrill = this.stack.length > 0;
    const i18n = window.i18n[currentLang()];

    return html`
      ${otherPackages.length > 0 ? html`
        <span class="separator-wrapper root-switcher-wrapper">
          <button
            class="root-switcher"
            @click="${this.#toggleRootSwitcher}"
          >▾</button>
          ${this._rootSwitcherOpen ? html`
            <div class="dropdown">
              <span class="dropdown-header">${i18n.network.switchPayload}</span>
              <div class="dropdown-separator"></div>
              ${otherPackages.map((pkg) => html`
                <button @click="${(event) => this.#handleRootSwitch(pkg.spec, event)}">
                  ${pkg.spec}
                </button>
              `)}
            </div>
          ` : nothing}
        </span>
      ` : nothing}
      <span class="root-entry">
        ${isInDrill
            ? html`<button @click="${this.#handleReset}">${this.root.name}@${this.root.version}</button>`
            : html`<span class="root-label">${this.root.name}@${this.root.version}</span>`
        }
        <button class="remove-btn" @click="${this.#handleRootRemove}" title="${i18n.network.removeFromCache}">×</button>
      </span>
      ${this.stack.map((entry, stackIndex) => {
        const siblingList = this.siblings?.[stackIndex] ?? [];
        const hasSiblings = siblingList.length > 0;

        return html`
          <span class="separator-wrapper">
            ${hasSiblings
                ? html`
                <button
                  class="separator has-siblings"
                  @click="${(event) => this.#toggleDropdown(stackIndex, event)}"
                >›</button>
                ${this._openDropdown === stackIndex ? html`
                  <div class="dropdown">
                    ${siblingList.map((sibling) => html`
                      <button @click="${(event) => this.#handleSiblingClick(stackIndex, sibling.nodeId, event)}">
                        ${sibling.name}@${sibling.version}
                      </button>
                    `)}
                  </div>
                ` : nothing}
              `
                : html`<span class="separator">›</span>`
            }
          </span>
          ${stackIndex === this.stack.length - 1
              ? html`<span class="active">${entry.name}@${entry.version}</span>`
              : html`<button @click="${() => this.#handleBack(stackIndex)}">${entry.name}@${entry.version}</button>`
          }
        `;
      })}
    `;
  }
}

customElements.define("network-breadcrumb", NetworkBreadcrumb);
