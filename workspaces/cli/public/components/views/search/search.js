// Import Third-party Dependencies
import { LitElement, html, nothing } from "lit";
import { getJSON } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "../../../common/utils.js";
import { searchViewStyles } from "./search-view-styles.js";

// CONSTANTS
const kMinPackageNameLength = 2;
const kMaxPackageNameLength = 64;

/**
 * @typedef {Object} SearchResult
 * @property {string} name
 * @property {string} version
 * @property {string} [description]
 */

/**
 * @returns {Record<string, any>}
 */
function getSearchI18n() {
  return /** @type {Record<string, any>} */ (/** @type {unknown} */ (utils.getI18n().search));
}

export class SearchView extends LitElement {
  #searchDebounced;
  /** @type {Map<string, string>} */
  #selectedVersions = new Map();
  #currentSearch = "";

  static styles = searchViewStyles;

  static properties = {
    scanning: { type: Boolean },
    scanSpec: { type: String },
    loading: { type: Boolean },
    hint: { type: String },
    notFound: { type: Boolean },
    results: { type: Array },
    cachedSpecs: { type: Array },
    _versionsMap: { state: true }
  };

  constructor() {
    super();
    this.scanning = false;
    this.scanSpec = "";
    this.loading = false;
    this.hint = "";
    this.notFound = false;
    /** @type {SearchResult[]} */
    this.results = [];
    /** @type {import("../../../types.js").CachedSpec[]} */
    this.cachedSpecs = [];
    /** @type {Map<string, string | string[]>} */
    this._versionsMap = new Map();
    this.#searchDebounced = utils.debounce(() => this.#handleSearchInput(this.#currentSearch), 500);
  }

  /**
   * @param {string} spec
   */
  onScan(spec) {
    this.scanning = true;
    this.scanSpec = spec;
    this.results = [];
    this.hint = "";
    this.notFound = false;
    this.loading = false;
  }

  /**
   * @param {string} message
   */
  onScanError(message) {
    this.scanning = false;
    this.scanSpec = "";
    this.hint = message;
  }

  reset() {
    this.scanning = false;
    this.scanSpec = "";
    this.results = [];
    this.hint = "";
    this.notFound = false;
    this.loading = false;
    this._versionsMap = new Map();
    this.#selectedVersions = new Map();
    this.#currentSearch = "";

    const input = /** @type {HTMLInputElement | null | undefined} */ (this.renderRoot?.querySelector("input"));
    if (input) {
      input.value = "";
    }
  }

  /**
   * @param {string} packageName
   */
  async #handleSearchInput(packageName) {
    const lang = utils.currentLang();
    this.hint = "";
    this.notFound = false;
    this.results = [];

    if (packageName.length === 0) {
      return;
    }

    if (packageName.length < kMinPackageNameLength || packageName.length > kMaxPackageNameLength) {
      this.hint = /** @type {Record<string, string>} */ (
        /** @type {unknown} */ (utils.getI18n(lang).search)
      ).packageLengthErr;

      return;
    }

    this.loading = true;

    try {
      const { result, count } = /** @type {{ result: SearchResult[], count: number }} */ (
        await getJSON(`/search/${encodeURIComponent(packageName)}`)
      );
      if (count === 0) {
        this.notFound = true;
      }
      else {
        this.results = result;
      }
    }
    finally {
      this.loading = false;
    }
  }

  /**
   * @param {string} name
   */
  async #loadVersions(name) {
    if (this._versionsMap.has(name)) {
      return;
    }

    this._versionsMap = new Map(this._versionsMap);
    this._versionsMap.set(name, "loading");

    try {
      const versions = /** @type {string[]} */ (await getJSON(`/search-versions/${encodeURIComponent(name)}`));
      this._versionsMap = new Map(this._versionsMap);
      this._versionsMap.set(name, versions.reverse());
    }
    catch {
      this._versionsMap = new Map(this._versionsMap);
      this._versionsMap.delete(name);
    }
  }

  #renderScanOverlay() {
    const { scanning } = getSearchI18n();

    return html`
      <div class="scan-overlay">
        <div class="scan-card">
          <div class="scan-rings">
            <div class="scan-ring"></div>
            <div class="scan-ring"></div>
            <div class="scan-ring"></div>
            <div class="scan-icon"><i class="icon-search"></i></div>
          </div>
          <div class="scan-spec">${this.scanSpec}</div>
          <div class="scan-label">
            ${scanning}
            <span class="scan-dot">·</span>
            <span class="scan-dot">·</span>
            <span class="scan-dot">·</span>
          </div>
        </div>
      </div>
    `;
  }

  #handleScan() {
    const spec = this.#currentSearch.trim();
    if (spec.length === 0) {
      return;
    }
    window.socket.commands.search(spec);
  }

  #renderHero() {
    const { heroTitle, emptyHint } = getSearchI18n();

    return html`
      <div class="hero">
        <i class="icon-search hero-icon"></i>
        <p class="hero-title">${heroTitle}</p>
        <p class="hero-subtitle">${emptyHint}</p>
      </div>
    `;
  }

  /**
   * @param {string} name
   * @param {string} latestVersion
   */
  #renderVersionSelect(name, latestVersion) {
    const versionState = this._versionsMap.get(name);
    const selectedVersion = this.#selectedVersions.get(name) ?? latestVersion;

    if (!versionState || versionState === "loading") {
      return html`
        <select
          class="version-select"
          ?disabled=${versionState === "loading"}
          @change=${(/** @type {Event} */ event) => this.#selectedVersions.set(
            name, /** @type {HTMLSelectElement} */ (event.target).value
          )}
        >
          <option value=${latestVersion}>${latestVersion}</option>
        </select>
      `;
    }

    const versions = /** @type {string[]} */ (versionState);

    return html`
      <select
        class="version-select"
        @change=${(/** @type {Event} */ event) => this.#selectedVersions.set(
          name, /** @type {HTMLSelectElement} */ (event.target).value
        )}
      >
        ${versions.map((version) => html`
          <option value=${version} ?selected=${version === selectedVersion}>${version}</option>
        `)}
      </select>
    `;
  }

  /**
   * @param {SearchResult} result
   */
  #renderResult({ name, version, description }) {
    const isExact = this.#currentSearch === name;

    return html`
      <div
        class="result ${isExact ? "exact" : ""}"
        @mouseenter=${() => this.#loadVersions(name)}
      >
        <div class="result-body">
          <span class="result-name" @click=${() => {
            const selectedVersion = this.#selectedVersions.get(name) ?? version;
            window.socket.commands.search(`${name}@${selectedVersion}`);
          }}>${name}</span>
          ${description ? html`<span class="result-description">${description}</span>` : nothing}
        </div>
        ${this.#renderVersionSelect(name, version)}
      </div>
    `;
  }

  /**
   * @param {string} title
   * @param {import("../../../types.js").CachedSpec[]} packages
   */
  #renderCacheSection(title, packages) {
    if (packages.length === 0) {
      return nothing;
    }

    return html`
      <div class="cache-section">
        <h2 class="cache-title">${title}</h2>
        ${packages.map((metadata) => {
          const { name, version } = utils.parseNpmSpec(metadata.spec);
          const isLocal = metadata.scanType === "cwd";

          return html`
            <div class="cache-item" @click=${() => window.socket.commands.search(metadata.spec)}>
              <span class="cache-item-name">
                ${name}@${version}${isLocal ? html` <b>local</b>` : nothing}
              </span>
              <button
                class="cache-remove"
                @click=${(/** @type {Event} */ event) => {
                  event.stopPropagation();
                  window.socket.commands.remove(metadata.spec);
                }}
              >×</button>
            </div>
          `;
        })}
      </div>
    `;
  }

  render() {
    if (!window.i18n) {
      return nothing;
    }

    if (this.scanning) {
      return this.#renderScanOverlay();
    }

    const i18n = getSearchI18n();
    const hasResults = this.results.length > 0;

    return html`
      <div class="container">
        ${this.#renderHero()}

        <form @submit=${(/** @type {Event} */ event) => event.preventDefault()}>
          <div class="search-bar">
            <input
              type="text"
              id="package"
              name="package"
              placeholder=${i18n.registryPlaceholder}
              autocomplete="off"
              @keydown=${(/** @type {KeyboardEvent} */ event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  this.#handleScan();
                }
              }}
              @input=${(/** @type {Event} */ event) => {
                this.#currentSearch = /** @type {HTMLInputElement} */ (event.target).value;
                this.#searchDebounced();
              }}
            >
            ${this.loading ? html`<div class="spinner-small"></div>` : nothing}
            <button class="scan-button" @click=${() => this.#handleScan()}>
              ${i18n.scan}
            </button>
          </div>
        </form>

        ${this.hint ? html`<div class="hint">${this.hint}</div>` : nothing}
        ${this.notFound ? html`<div class="not-found">${i18n.noPackageFound}</div>` : nothing}

        ${hasResults ? html`
          <div class="results">
            ${this.results.map((result) => this.#renderResult(result))}
          </div>
        ` : nothing}

        ${hasResults ? nothing : html`
          ${this.#renderCacheSection(i18n.packagesCache, this.cachedSpecs)}
        `}
      </div>
    `;
  }
}

customElements.define("search-view", SearchView);
