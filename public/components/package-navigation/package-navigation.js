// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";

// Import Internal Dependencies
import * as utils from "../../common/utils.js";
import "../icon/icon.js";

/**
 * @typedef {Object} PackageMetadata
 * @property {string} spec - Package spec (e.g. "package@1.0.0")
 * @property {string} scanType - Type of scan ("cwd" for local)
 * @property {string} locationOnDisk - Path to the package on disk
 * @property {number} lastUsedAt - Timestamp of last usage
 * @property {string | null} integrity - Package integrity hash
 */

class PackageNavigation extends LitElement {
  static styles = css`
    b,p {
      margin: 0;
      padding: 0;
      border: 0;
      font: inherit;
      font-size: 100%;
    }

    :host {
      z-index: 30;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 30px;
      left: 50px;
      padding-left: 20px;
      max-width: calc(100vw - 70px);
      box-sizing: border-box;
      background: var(--primary);
      box-shadow: 2px 1px 10px #26107f7a;
    }

    :host-context(body.dark) {
      background: var(--dark-theme-primary-color);
    }

    .packages {
      height: 30px;
      display: flex;
      background: var(--primary);
    }

    .packages > .package {
      height: 30px;
      font-family: mononoki;
      display: flex;
      align-items: center;
      background: linear-gradient(to right, rgb(55 34 175 / 100%) 0%, rgb(87 74 173 / 100%) 50%, rgb(59 110 205) 100%);
      padding: 0 10px;
      border-right: 2px solid #0f041a;
      text-shadow: 1px 1px 10px #000;
      color: #def7ff;
    }

    :host-context(body.dark) .packages > .package {
      background: linear-gradient(to right, rgb(11 3 31 / 100%) 0%, rgb(11 3 31 / 80%) 50%, rgb(11 3 31 / 60%) 100%);
    }

    .packages > .package > * {
      transform: skewX(20deg);
    }

    .packages > .package:first-child {
      padding-left: 10px;
    }

    .packages > .package:not(.active):hover {
      background: linear-gradient(to right, rgb(55 34 175 / 100%) 1%, rgb(68 121 218) 100%);
      color: #defff9;
      cursor: pointer;
    }

    :host-context(body.dark) .packages > .package:not(.active):hover {
      background: linear-gradient(to right, rgb(11 3 31 / 70%) 1%, rgb(11 3 31 / 50%) 100%);
    }

    .packages > .package.active {
      background: linear-gradient(to right, rgb(55 34 175 / 100%) 0%, rgb(87 74 173 / 100%) 50%, rgb(59 110 205) 100%);
    }

    .packages > .package.active > b {
      background: var(--secondary);
    }

    .packages > .package.active > .remove {
      display: block;
    }

    .packages > .package > b:last-of-type:not(:first-of-type) {
      background: #f57c00;
    }

    .packages > .package > b {
      font-weight: bold;
      font-size: 12px;
      margin-left: 5px;
      background: var(--secondary-darker);
      padding: 3px 5px;
      border-radius: 2px;
      font-family: Roboto;
      letter-spacing: 1px;
    }

    .add {
      height: 30px;
      font-size: 20px;
      border: none;
      background: var(--secondary-darker);
      cursor: pointer;
      padding: 0 7px;
      transition: 0.2s all ease;
      color: #def7ff;
    }

    .add:hover {
      background: var(--secondary);
      cursor: pointer;
    }

    .add > i {
      transform: skewX(20deg);
    }

    button.remove {
      display: none;
      border: none;
      position: relative;
      cursor: pointer;
      color: #fff5dc;
      background: #ff3434e2;
      margin-left: 10px;
      border-radius: 50%;
      line-height: 16px;
      text-shadow: 1px 1px 10px #000;
      font-weight: bold;
      width: 20px;
    }

    button.remove:hover {
      cursor: pointer;
      background: #ff5353e2;
    }
  `;

  static properties = {
    /**
     * Array of package metadata objects
     * @type {PackageMetadata[]}
     */
    metadata: { type: Array },
    /**
     * Currently active package spec
     * @type {string}
     */
    activePackage: { type: String }
  };

  constructor() {
    super();
    /** @type {PackageMetadata[]} */
    this.metadata = [];
    /** @type {string} */
    this.activePackage = "";
  }

  /**
   * Check if there are at least 2 packages
   * @returns {boolean}
   */
  get #hasAtLeast2Packages() {
    return this.metadata.length > 1;
  }

  /**
   * Handle click on a package to select it
   * @param {string} spec
   */
  #handlePackageClick(spec) {
    if (this.activePackage !== spec) {
      window.socket.commands.search(spec);
    }
  }

  /**
   * Handle click on remove button
   * @param {Event} event
   * @param {string} packageName
   */
  #handleRemoveClick(event, packageName) {
    event.stopPropagation();
    window.socket.commands.remove(packageName);
  }

  #handleAddClick() {
    window.navigation.setNavByName("search--view");
  }

  /**
   * Render a single package element
   * @param {PackageMetadata} param0
   * @returns {import("lit").TemplateResult}
   */
  #renderPackage({ spec, scanType }) {
    const isLocal = scanType === "cwd";
    const { name, version } = utils.parseNpmSpec(spec);
    const isActive = spec === this.activePackage;

    return html`
      <div
        class="package ${isActive ? "active" : ""}"
        data-name="${spec}"
        @click="${() => this.#handlePackageClick(spec)}"
      >
        <p>${name}</p>
        <b>v${version}</b>
        ${isLocal ? html`<b>local</b>` : nothing}
        ${this.#hasAtLeast2Packages
          ? html`
              <button
                class="remove"
                @click="${(e) => this.#handleRemoveClick(e, spec)}"
              >
                x
              </button>
            `
          : nothing}
      </div>
    `;
  }

  render() {
    if (this.metadata.length === 0) {
      return nothing;
    }

    return html`
      <div class="packages">
        ${repeat(
          this.metadata,
          (pkg) => pkg.spec,
          (pkg) => this.#renderPackage(pkg)
        )}
      </div>
      <button class="add" @click="${this.#handleAddClick}">
        <p>+</p>
      </button>
    `;
  }
}

customElements.define("package-navigation", PackageNavigation);
