// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";

// Import Internal Dependencies
import { EVENTS } from "../../core/events.js";

class DrillBreadcrumb extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      top: 38px;
      left: 10px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgb(10 10 20 / 72%);
      border-radius: 6px;
      padding: 4px 10px;
      font-family: mononoki, monospace;
      font-size: 12px;
      color: #fff;
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
      left: 50%;
      transform: translateX(-50%);
      background: rgb(10 10 20 / 95%);
      border: 1px solid rgb(255 255 255 / 15%);
      border-radius: 6px;
      padding: 4px 0;
      min-width: 180px;
      max-height: 260px;
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
      background: rgb(255 255 255 / 10%);
      color: #fff;
      text-decoration: none;
    }
  `;

  static properties = {
    root: { type: Object },
    stack: { type: Array },
    siblings: { type: Array },
    _openDropdown: { state: true }
  };

  constructor() {
    super();
    this.root = null;
    this.stack = [];
    this.siblings = [];
    this._openDropdown = null;
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
    this.hidden = this.stack.length === 0 || this.root === null;
  }

  #handleDocumentClick = () => {
    if (this._openDropdown !== null) {
      this._openDropdown = null;
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

  render() {
    if (this.stack.length === 0 || this.root === null) {
      return nothing;
    }

    return html`
      <button @click="${this.#handleReset}">${this.root.name}@${this.root.version}</button>
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

customElements.define("drill-breadcrumb", DrillBreadcrumb);
