// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";

// Import Internal Dependencies
import { EVENTS } from "../../core/events.js";

export class RootSelector extends LitElement {
  static properties = {
    secureDataSet: { attribute: false },
    _open: { state: true }
  };

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
      color: #1a1a2e;
    }

    :host-context(body.dark) {
      color: rgb(255 255 255 / 87%);
    }

    .selector-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: white;
      border: 1.5px solid rgb(55 34 175 / 20%);
      border-radius: 8px;
      padding: 5px 10px;
      cursor: pointer;
      font-family: mononoki, monospace;
      font-size: 13px;
      color: #1a1a2e;
      transition: background 0.12s, border-color 0.12s;
      white-space: nowrap;
    }

    .selector-btn:hover {
      background: #f0eeff;
      border-color: rgb(55 34 175 / 40%);
    }

    :host-context(body.dark) .selector-btn {
      background: #1e1c2e;
      border-color: rgb(163 148 255 / 25%);
      color: rgb(255 255 255 / 87%);
    }

    :host-context(body.dark) .selector-btn:hover {
      background: #2a2640;
      border-color: rgb(163 148 255 / 45%);
    }

    .pkg-version {
      color: #7c6fff;
    }

    :host-context(body.dark) .pkg-version {
      color: #a394ff;
    }

    .chevron {
      font-size: 9px;
      opacity: 0.5;
      margin-left: 2px;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 100%;
      background: white;
      border: 1px solid rgb(0 0 0 / 10%);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
      z-index: 100;
      overflow: hidden;
      padding: 4px 0;
    }

    :host-context(body.dark) .dropdown {
      background: #1e1c2e;
      border-color: rgb(255 255 255 / 10%);
      box-shadow: 0 8px 24px rgb(0 0 0 / 40%);
    }

    .pkg-item {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 7px 14px;
      font-family: mononoki, monospace;
      font-size: 12px;
      color: #1a1a2e;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.1s;
    }

    :host-context(body.dark) .pkg-item {
      color: rgb(255 255 255 / 87%);
    }

    .pkg-item:hover {
      background: rgb(124 111 255 / 8%);
    }

    :host-context(body.dark) .pkg-item:hover {
      background: rgb(163 148 255 / 10%);
    }

    .item-version {
      color: #7c6fff;
    }

    :host-context(body.dark) .item-version {
      color: #a394ff;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._handleOutsideClick = (event) => {
      if (!event.composedPath().includes(this)) {
        this._open = false;
      }
    };

    document.addEventListener("click", this._handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleOutsideClick);
  }

  #switchTo(spec) {
    window.dispatchEvent(new CustomEvent(EVENTS.ROOT_SWITCH, {
      detail: { spec }
    }));
    this._open = false;
  }

  render() {
    if (!this.secureDataSet) {
      return nothing;
    }

    const rootEntry = this.secureDataSet.linker.get(0);
    if (!rootEntry) {
      return nothing;
    }

    const others = (window.cachedSpecs ?? []).filter(
      (pkg) => pkg.spec !== window.activePackage
    );

    return html`
      <button
        class="selector-btn"
        @click=${(event) => {
          event.stopPropagation();
          if (others.length > 0) {
            this._open = !this._open;
          }
        }}
      >
        <span class="pkg-name">${rootEntry.name}</span>
        <span class="pkg-version">@${rootEntry.version}</span>
        ${others.length > 0
            ? html`<span class="chevron">${this._open ? "▴" : "▾"}</span>`
            : nothing
        }
      </button>
      ${this._open && others.length > 0 ? html`
        <div class="dropdown">
          ${others.map((pkg) => {
            const atIndex = pkg.spec.lastIndexOf("@");
            const pkgName = pkg.spec.slice(0, atIndex);
            const pkgVersion = pkg.spec.slice(atIndex);

            return html`
              <div class="pkg-item" @click=${() => this.#switchTo(pkg.spec)}>
                <span class="item-name">${pkgName}</span>
                <span class="item-version">${pkgVersion}</span>
              </div>
            `;
          })}
        </div>
      ` : nothing}
    `;
  }
}

customElements.define("root-selector", RootSelector);
