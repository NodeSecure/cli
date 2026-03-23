// Import Third-party Dependencies
import { LitElement, html, nothing } from "lit";
import { getJSON } from "@nodesecure/vis-network";

// Import Internal Dependencies
import { currentLang, debounce, parseNpmSpec } from "../../../common/utils.js";
import { searchViewStyles } from "./search-view-styles.js";

// CONSTANTS
const kMinPackageNameLength = 2;
const kMaxPackageNameLength = 64;

class SearchView extends LitElement {
  #searchDebounced;
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
    this.results = [];
    this.cachedSpecs = [];
    this._versionsMap = new Map();
    this.#searchDebounced = debounce(() => this.#handleSearchInput(this.#currentSearch), 500);
  }

  onScan(spec) {
    this.scanning = true;
    this.scanSpec = spec;
    this.results = [];
    this.hint = "";
    this.notFound = false;
    this.loading = false;
  }

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

    const input = this.renderRoot?.querySelector("input");
    if (input) {
      input.value = "";
    }
  }

  async #handleSearchInput(packageName) {
    const lang = currentLang();
    this.hint = "";
    this.notFound = false;
    this.results = [];

    if (packageName.length === 0) {
      return;
    }

    if (packageName.length < kMinPackageNameLength || packageName.length > kMaxPackageNameLength) {
      this.hint = window.i18n[lang].search.packageLengthErr;

      return;
    }

    this.loading = true;

    try {
      const { result, count } = await getJSON(`/search/${encodeURIComponent(packageName)}`);
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

  async #loadVersions(name) {
    if (this._versionsMap.has(name)) {
      return;
    }

    this._versionsMap = new Map(this._versionsMap);
    this._versionsMap.set(name, "loading");

    try {
      const versions = await getJSON(`/search-versions/${encodeURIComponent(name)}`);
      this._versionsMap = new Map(this._versionsMap);
      this._versionsMap.set(name, versions.reverse());
    }
    catch {
      this._versionsMap = new Map(this._versionsMap);
      this._versionsMap.delete(name);
    }
  }

  #renderScanOverlay() {
    const { scanning } = window.i18n[currentLang()].search;

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
    const { heroTitle, emptyHint } = window.i18n[currentLang()].search;

    return html`
      <div class="hero">
        <i class="icon-search hero-icon"></i>
        <p class="hero-title">${heroTitle}</p>
        <p class="hero-subtitle">${emptyHint}</p>
      </div>
    `;
  }

  #renderVersionSelect(name, latestVersion) {
    const versionState = this._versionsMap.get(name);
    const selectedVersion = this.#selectedVersions.get(name) ?? latestVersion;

    if (!versionState || versionState === "loading") {
      return html`
        <select
          class="version-select"
          ?disabled=${versionState === "loading"}
          @change=${(event) => this.#selectedVersions.set(name, event.target.value)}
        >
          <option value=${latestVersion}>${latestVersion}</option>
        </select>
      `;
    }

    return html`
      <select
        class="version-select"
        @change=${(event) => this.#selectedVersions.set(name, event.target.value)}
      >
        ${versionState.map((version) => html`
          <option value=${version} ?selected=${version === selectedVersion}>${version}</option>
        `)}
      </select>
    `;
  }

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

  #renderCacheSection(title, packages) {
    if (packages.length === 0) {
      return nothing;
    }

    return html`
      <div class="cache-section">
        <h2 class="cache-title">${title}</h2>
        ${packages.map((pkg) => {
          const { name, version, local } = parseNpmSpec(pkg);

          return html`
            <div class="cache-item" @click=${() => window.socket.commands.search(pkg)}>
              <span class="cache-item-name">
                ${name}@${version}${local ? html` <b>local</b>` : nothing}
              </span>
              <button
                class="cache-remove"
                @click=${(event) => {
                  event.stopPropagation();
                  window.socket.commands.remove(pkg);
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

    const { search: i18n } = window.i18n[currentLang()];
    const hasResults = this.results.length > 0;

    return html`
      <div class="container">
        ${this.#renderHero()}

        <form @submit=${(event) => event.preventDefault()}>
          <div class="search-bar">
            <input
              type="text"
              id="package"
              name="package"
              placeholder=${i18n.registryPlaceholder}
              autocomplete="off"
              @keydown=${(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  this.#handleScan();
                }
              }}
              @input=${(event) => {
                this.#currentSearch = event.target.value;
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
