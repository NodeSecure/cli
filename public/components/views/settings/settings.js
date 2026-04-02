// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { getJSON } from "@nodesecure/vis-network";
import { warnings } from "@nodesecure/js-x-ray/warnings";

// Import Internal Dependencies
import { EVENTS } from "../../../core/events.js";
import { currentLang } from "../../../common/utils.js";
import { FLAG_IGNORE_ITEMS } from "../../../common/flags.js";

// CONSTANTS
const kAllowedHotKeys = new Set([
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
  "u", "w", "x", "y", "z"
]);
const kDefaultHotKeys = {
  home: "H",
  network: "N",
  settings: "S",
  wiki: "W",
  lock: "L",
  search: "F",
  tree: "T",
  warnings: "A"
};
const kShortcutInputTargetIds = new Set(Object.keys(kDefaultHotKeys));
const kShortcuts = [
  { id: "home", labelKey: "goto", viewKey: "home" },
  { id: "network", labelKey: "goto", viewKey: "network" },
  { id: "search", labelKey: "goto", viewKey: "search" },
  { id: "settings", labelKey: "goto", viewKey: "settings" },
  { id: "tree", labelKey: "goto", viewKey: "tree" },
  { id: "warnings", labelKey: "goto", viewKey: "warnings" },
  { id: "wiki", labelKey: "openCloseWiki", viewKey: null },
  { id: "lock", labelKey: "lock", viewKey: null }
];

export class SettingsView extends LitElement {
  static defaultMenuName = "info";

  static properties = {
    config: { attribute: false },
    _saveEnabled: { state: true },
    _hotkeys: { state: true }
  };

  static styles = css`
    :host {
      flex-direction: column;
      z-index: 10;
      padding: 60px;
      box-sizing: border-box;
      height: 100%;
      overflow-y: auto;
    }

    :host > h1,
    :host h2 {
      height: 40px;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      color: var(--primary);
      font-size: 24px;
      font-family: mononoki;
    }

    :host-context(body.dark) h1,
    :host-context(body.dark) h2 {
      color: var(--dark-theme-secondary-color);
      border-bottom: 2px solid var(--dark-theme-secondary-color);
    }

    :host h2 {
      margin-top: 30px;
    }

    :host .icon-keyboard {
      background: url("../../../img/keyboard-solid.svg");
      background-position: 10% center;
      background-repeat: no-repeat;
      width: 34px;
      height: 20px;
      margin-right: 2px;
      filter: invert(14%) sepia(80%) saturate(5663%) hue-rotate(252deg) brightness(69%) contrast(98%);
    }

    :host-context(body.dark) .icon-keyboard {
      filter: invert(75%) sepia(81%) saturate(3055%) hue-rotate(178deg) brightness(86%) contrast(88%);
    }

    :host > h1 i {
      margin-right: 5px;
    }

    :host > form {
      display: flex;
      flex-wrap: wrap;
    }

    :host > form .line {
      display: flex;
      flex-basis: 340px;
      flex-direction: column;
      min-height: 30px;
      margin-bottom: 30px;
      padding-right: 30px;
      box-sizing: border-box;
    }

    :host > form .line p,
    :host > form .line label {
      font-size: 15px;
      color: #4a5e68;
      letter-spacing: 0.5px;
    }

    :host-context(body.dark) form .line p,
    :host-context(body.dark) form .line label {
      color: var(--dark-theme-secondary-lighter);
    }

    :host > form .line > p,
    :host > form .line > label {
      margin-bottom: 6px;
      font-weight: bold;
    }

    :host .shortcuts div:nth-child(n+1) {
      margin-top: 10px;
    }

    :host .shortcuts .note {
      border-left: 3px solid #01579B;
      padding: 10px 15px;
      background: #81d4fa59;
      color: #283593;
      font-weight: 400;
      border-radius: 2px;
      box-sizing: border-box;
      margin-bottom: 20px;
    }

    :host-context(body.dark) .shortcuts .note {
      background: var(--dark-theme-accent-darker);
      color: white;
    }

    :host .shortcuts label {
      color: #4a5e68;
      margin-left: 10px;
      font-weight: 500;
    }

    :host-context(body.dark) .shortcuts label {
      color: var(--dark-theme-secondary-lighter);
    }

    :host .shortcuts input:read-only {
      background: transparent;
      border-color: rgb(168 168 168);
      color: rgb(141 140 140);
      border-style: solid;
    }

    :host-context(body.dark) .shortcuts input:read-only {
      border-color: var(--dark-theme-secondary-lighter);
      color: var(--dark-theme-secondary-lighter);
    }

    :host .shortcuts input {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      text-align: center;
      font-family: system-ui;
      font-size: 20px;
      font-weight: 500;
      border-bottom-width: 4px;
    }

    :host > form .line > div {
      display: flex;
      height: 22px;
      color: #334148;
      align-items: center;
      margin-left: 10px;
    }

    :host-context(body.dark) form .line > div {
      color: var(--dark-theme-secondary-lighter);
    }

    :host > form .line select {
      margin-left: 10px;
    }

    :host > form .line input[type="checkbox"] {
      margin-left: 0;
    }

    :host > form .line > div + div {
      margin-top: 5px;
    }

    :host > form .line > div > p {
      margin-left: 5px;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    label {
      color: #4a5e68;
    }

    button.save {
      height: 30px;
      width: 100px;
      background: #27a845;
      color: #FFF;
      border-radius: 4px;
      margin-top: 30px;
      border: none;
      outline: none;
      font-family: mononoki;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-shadow: 2px 2px 5px #00000061;
    }

    button.save.disabled {
      background: #334148;
      opacity: 0.35;
    }

    button.save:not(.disabled):hover {
      background-color: var(--secondary-darker);
      cursor: pointer;
    }

    select {
      max-width: 200px;
      border: 1px solid #B0BEC5;
      height: 30px;
      border-radius: 4px;
      font-family: mononoki;
      color: #0c5a9b;
    }

    :host-context(body.dark) select {
      color: var(--dark-theme-secondary-lighter);
      border: var(--dark-theme-secondary-darker) 1px solid;
      background: var(--dark-theme-primary-darker);
    }

    .settings-line-title {
      font-size: 15px;
      color: #4a5e68;
      letter-spacing: 0.5px;
      margin: 30px 0 6px;
      font-weight: bold;
    }

    :host-context(body.dark) .settings-line-title {
      color: var(--dark-theme-secondary-color);
    }

    .mt-10 {
      margin-top: 10px;
    }
  `;

  constructor() {
    super();
    this.config = null;
    this._saveEnabled = false;

    const storedHotkeys = localStorage.getItem("hotkeys");
    if (storedHotkeys === null) {
      localStorage.setItem("hotkeys", JSON.stringify(kDefaultHotKeys));
      this._hotkeys = { ...kDefaultHotKeys };
    }
    else {
      this._hotkeys = JSON.parse(storedHotkeys);
    }
  }

  #onSettingsSaved = (event) => {
    this.setNewConfig(event.detail);
    this._saveEnabled = false;
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.SETTINGS_SAVED, this.#onSettingsSaved);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.SETTINGS_SAVED, this.#onSettingsSaved);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this.updateNavigationHotKey(this._hotkeys);
  }

  async fetchUserConfig() {
    const config = await getJSON("/config");
    this.setNewConfig(config);

    return this;
  }

  setNewConfig(config) {
    this.config = {
      ...config,
      ignore: {
        warnings: new Set(config.ignore.warnings),
        flags: new Set(config.ignore.flags)
      },
      theme: config.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    };
  }

  updateNavigationHotKey(hotkeys) {
    const navigationElement = document.getElementById("view-navigation");
    if (navigationElement === null) {
      return;
    }

    for (const span of navigationElement.querySelectorAll("span")) {
      // network--view -> network
      const viewName = span.parentElement.getAttribute("data-menu").split("--")[0];
      span.textContent = hotkeys[viewName];
    }
  }

  #enableSaveButton() {
    this._saveEnabled = true;
  }

  #updateHotKeys() {
    const hotkeys = {};
    for (const input of this.renderRoot.querySelectorAll(".hotkey")) {
      hotkeys[input.id] = input.value;
    }

    this._hotkeys = hotkeys;
    this.updateNavigationHotKey(hotkeys);
    localStorage.setItem("hotkeys", JSON.stringify(hotkeys));
  }

  #onHotkeyClick(event) {
    const input = event.currentTarget;
    if (!input.readOnly) {
      return;
    }

    const currentValue = input.value;
    input.readOnly = false;
    input.value = "";

    const onKeyDown = (keyEvent) => {
      if (!kShortcutInputTargetIds.has(keyEvent.target.id)) {
        return;
      }

      // Prevent the app to change view if key is equal to view's hotkey
      keyEvent.preventDefault();
      keyEvent.stopPropagation();

      const setValue = (value) => {
        input.value = value;
        input.readOnly = true;
        input.blur();
        input.removeEventListener("keydown", onKeyDown);
        this.#updateHotKeys();
      };

      if (keyEvent.key === currentValue) {
        setValue(currentValue);

        return;
      }

      if (kAllowedHotKeys.has(keyEvent.key.toLowerCase())) {
        const isHotKeyAlreadyUsed = [...this.renderRoot.querySelectorAll(".hotkey")]
          .find((existingInput) => existingInput.value === keyEvent.key.toUpperCase());

        setValue(isHotKeyAlreadyUsed ? currentValue : keyEvent.key.toUpperCase());
      }
    };
    input.addEventListener("keydown", onKeyDown);
  }

  async #saveSettings() {
    if (!this._saveEnabled) {
      return;
    }

    const defaultPackageMenu = this.renderRoot.querySelector("#default_package_menu");
    const themeSelector = this.renderRoot.querySelector("#theme_selector");
    const showFriendly = this.renderRoot.querySelector("#show-friendly");
    const disableExternal = this.renderRoot.querySelector("#disable-external");

    const newConfig = {
      defaultPackageMenu: defaultPackageMenu.value || SettingsView.defaultMenuName,
      ignore: { flags: new Set(), warnings: new Set() },
      showFriendlyDependencies: showFriendly.checked,
      theme: themeSelector.value,
      disableExternalRequests: disableExternal.checked
    };

    for (const checkbox of this.renderRoot.querySelectorAll("input[name='warnings']")) {
      if (checkbox.checked) {
        newConfig.ignore.warnings.add(checkbox.value);
      }
    }

    for (const checkbox of this.renderRoot.querySelectorAll("input[name='flags']")) {
      if (checkbox.checked) {
        newConfig.ignore.flags.add(checkbox.value);
      }
    }

    await fetch("/config", {
      method: "put",
      body: JSON.stringify({
        ...newConfig,
        ignore: {
          warnings: [...newConfig.ignore.warnings],
          flags: [...newConfig.ignore.flags]
        }
      }),
      headers: {
        "content-type": "application/json"
      }
    });

    this.config = newConfig;
    this._saveEnabled = false;

    window.dispatchEvent(new CustomEvent(EVENTS.SETTINGS_SAVED, { detail: this.config }));
  }

  #renderWarningCheckboxes() {
    return Object.keys(warnings).map((id) => html`
      <div>
        <input
          type="checkbox"
          id=${id}
          name="warnings"
          value=${id}
          ?checked=${this.config.ignore.warnings.has(id)}
          @change=${() => this.#enableSaveButton()}
        />
        <label for=${id}>${id.replaceAll("-", " ")}</label>
      </div>
    `);
  }

  #renderFlagCheckboxes() {
    return FLAG_IGNORE_ITEMS.map(({ value, emoji }) => html`
      <div>
        <input
          type="checkbox"
          id=${value}
          name="flags"
          value=${value}
          ?checked=${this.config.ignore.flags.has(value)}
          @change=${() => this.#enableSaveButton()}
        />
        <label for=${value}>${emoji} ${value}</label>
      </div>
    `);
  }

  #renderShortcuts(shortcuts) {
    return kShortcuts.map(({ id, labelKey, viewKey }) => html`
      <div>
        <input
          readonly
          id=${id}
          class="hotkey"
          .value=${this._hotkeys[id] ?? ""}
          @click=${(event) => this.#onHotkeyClick(event)}
        />
        <label for=${id}>${shortcuts[labelKey]}${viewKey ? ` ${shortcuts.views[viewKey]}` : ""}</label>
      </div>
    `);
  }

  render() {
    if (this.config === null) {
      return nothing;
    }

    const i18n = window.i18n[currentLang()];
    const general = i18n.settings.general;
    const shortcuts = i18n.settings.shortcuts;
    const packageNav = i18n.package_info.navigation;

    return html`
      <h1><i class="icon-cog"></i>${general.title}</h1>
      <form>
        <div class="line">
          <label for="default_package_menu">${general.defaultPannel}:</label>
          <select
            name="defaultPackageMenu"
            id="default_package_menu"
            @change=${() => this.#enableSaveButton()}
          >
            <option value="info" ?selected=${this.config.defaultPackageMenu === "info"}>${packageNav.overview}</option>
            <option value="files" ?selected=${this.config.defaultPackageMenu === "files"}>${packageNav.files}</option>
            <option value="dependencies"
              ?selected=${this.config.defaultPackageMenu === "dependencies"}>${packageNav.dependencies}</option>
            <option value="warnings"
              ?selected=${this.config.defaultPackageMenu === "warnings"}>${packageNav.warnings}</option>
            <option value="vulnerabilities"
              ?selected=${this.config.defaultPackageMenu === "vulnerabilities"}>${packageNav.vulnerabilities}</option>
            <option value="licenses" ?selected=${this.config.defaultPackageMenu === "licenses"}>${packageNav.licenses}</option>
          </select>
          <label for="theme_selector" class="mt-10">${general.themePannel}:</label>
          <select
            name="themeSelector"
            id="theme_selector"
            @change=${() => this.#enableSaveButton()}
          >
            <option value="dark" ?selected=${this.config.theme === "dark"}>${packageNav.dark}</option>
            <option value="light" ?selected=${this.config.theme === "light"}>${packageNav.light}</option>
          </select>
          <p class="settings-line-title">${general.network}:</p>
          <div>
            <input
              type="checkbox"
              id="show-friendly"
              name="show-friendly"
              ?checked=${this.config.showFriendlyDependencies}
              @change=${() => this.#enableSaveButton()}
            />
            <label for="show-friendly">${general.showFriendly}</label>
          </div>
          <p class="settings-line-title">${general.security}:</p>
          <div>
            <input
              type="checkbox"
              id="disable-external"
              name="disable-external"
              ?checked=${this.config.disableExternalRequests}
              @change=${() => this.#enableSaveButton()}
            />
            <label for="disable-external">${general.disableExternalRequests}</label>
          </div>
        </div>
        <div class="line">
          <p>${general.warnings}:</p>
          ${this.#renderWarningCheckboxes()}
        </div>
        <div class="line">
          <p>${general.flags}:</p>
          ${this.#renderFlagCheckboxes()}
        </div>
      </form>
      <button
        class="save ${this._saveEnabled ? "" : "disabled"}"
        @click=${() => this.#saveSettings().catch(console.error)}
      >
        ${general.save}
      </button>
      <div class="line">
        <h2><i class="icon-keyboard"></i>${shortcuts.title}</h2>
        <div class="shortcuts">
          <div class="note">💡 ${shortcuts.blockquote}</div>
          ${this.#renderShortcuts(shortcuts)}
        </div>
      </div>
    `;
  }
}

customElements.define("settings-view", SettingsView);
