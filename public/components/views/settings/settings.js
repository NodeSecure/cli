// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

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
  search: "F"
};
const kShortcutInputTargetIds = new Set(Object.keys(kDefaultHotKeys));

export class Settings {
  static defaultMenuName = "info";

  constructor() {
    this.saveEnabled = false;
    this.dom = {
      /** @type {HTMLSelectElement} */
      defaultPackageMenu: document.getElementById("default_package_menu"),
      /** @type {HTMLInputElement[]} */
      warningsCheckbox: document.querySelectorAll("input[name='warnings']"),
      /** @type {HTMLInputElement[]} */
      flagsCheckbox: document.querySelectorAll("input[name='flags']"),
      /** @type {HTMLInputElement} */
      shortcutsSection: document.querySelector(".shortcuts"),
      /** @type {HTMLInputElement} */
      showFriendlyDependenciesCheckbox: document.querySelector("#show-friendly")
    };

    this.saveButton = document.querySelector(".save");
    this.saveButton.addEventListener("click", () => this.saveSettings().catch(console.error));
    this.saveButton.classList.add("disabled");

    this.dom.defaultPackageMenu.addEventListener("change", () => this.enableSaveButton());
    for (const checkbox of [...this.dom.warningsCheckbox, ...this.dom.flagsCheckbox, this.dom.showFriendlyDependenciesCheckbox]) {
      checkbox.addEventListener("change", () => this.enableSaveButton());
    }

    const self = this;
    this.dom.shortcutsSection.querySelectorAll(".hotkey").forEach((input) => {
      input.addEventListener("click", () => {
        if (!input.readOnly) {
          return;
        }

        const currentValue = input.value;
        input.readOnly = false;
        input.value = "";

        const onKeyDown = (event) => {
          if (kShortcutInputTargetIds.has(event.target.id) === false) {
            return;
          }

          // Prevent the app to change view if key is equal to view's hotkey
          event.preventDefault();
          event.stopPropagation();

          function setValue(value) {
            input.value = value;
            input.readOnly = true;
            input.blur();
            input.removeEventListener("keydown", onKeyDown);
            self.updateHotKeys();
          }
          if (event.key === currentValue) {
            setValue(currentValue);
          }

          if (kAllowedHotKeys.has(event.key.toLowerCase())) {
            const isHotKeyAlreadyUsed = [...this.dom.shortcutsSection.querySelectorAll(".hotkey")]
              .find((input) => input.value === event.key.toUpperCase());

            setValue(isHotKeyAlreadyUsed ? currentValue : event.key.toUpperCase());
          }
        };
        input.addEventListener("keydown", onKeyDown);
      });
    });

    if (localStorage.getItem("hotkeys") === null) {
      localStorage.setItem("hotkeys", JSON.stringify(kDefaultHotKeys));
    }

    const hotkeys = JSON.parse(localStorage.getItem("hotkeys"));
    this.updateNavigationHotKey(hotkeys);
    this.updateFormHotKeys(hotkeys);
  }

  updateNavigationHotKey(hotkeys) {
    const navigationElement = document.getElementById("view-navigation");
    navigationElement.querySelectorAll("span").forEach((span) => {
      // network--view -> network
      const viewName = span.parentElement.getAttribute("data-menu").split("--")[0];
      const hotkey = hotkeys[viewName];
      span.textContent = hotkey;
    });
  }

  updateFormHotKeys(hotkeys) {
    const hotkeysInputs = [...this.dom.shortcutsSection.querySelectorAll(".hotkey")];

    for (const input of hotkeysInputs) {
      const viewName = input.getAttribute("id");
      const hotkey = hotkeys[viewName];
      input.value = hotkey;
    }
  }

  updateHotKeys() {
    const hotkeys = {};
    const hotkeysInputs = this.dom.shortcutsSection.querySelectorAll(".hotkey");

    for (const input of hotkeysInputs) {
      const hotkeyName = input.getAttribute("id");
      hotkeys[hotkeyName] = input.value;
    }

    this.updateNavigationHotKey(hotkeys);
    localStorage.setItem("hotkeys", JSON.stringify(hotkeys));
  }

  enableSaveButton() {
    if (this.saveButton.classList.contains("disabled")) {
      this.saveButton.classList.remove("disabled");
    }
  }

  setNewConfig(config) {
    this.config = config;
    this.warnings = new Set(this.config.ignore.warnings);
    this.flags = new Set(this.config.ignore.flags);
    this.config.ignore.warnings = this.warnings;
    this.config.ignore.flags = this.flags;
  }

  async fetchUserConfig() {
    const config = await getJSON("/config");
    this.setNewConfig(config);
    this.updateSettings();

    return this;
  }

  async saveSettings() {
    if (this.saveButton.classList.contains("disabled")) {
      return;
    }

    const newConfig = {
      defaultPackageMenu: this.dom.defaultPackageMenu.value || Settings.defaultMenuName,
      ignore: { flags: new Set(), warnings: new Set() },
      showFriendlyDependencies: this.dom.showFriendlyDependenciesCheckbox.checked
    };

    for (const checkbox of this.dom.warningsCheckbox) {
      if (checkbox.checked) {
        newConfig.ignore.warnings.add(checkbox.getAttribute("value"));
      }
    }

    for (const checkbox of this.dom.flagsCheckbox) {
      if (checkbox.checked) {
        newConfig.ignore.flags.add(checkbox.getAttribute("value"));
      }
    }

    newConfig.ignore.warnings = [...newConfig.ignore.warnings];
    newConfig.ignore.flags = [...newConfig.ignore.flags];

    await fetch("/config", {
      method: "put",
      body: JSON.stringify(newConfig),
      headers: {
        "content-type": "application/json"
      }
    });
    this.config = newConfig;
    this.saveButton.classList.add("disabled");

    window.dispatchEvent(new CustomEvent("settings-saved", { detail: this.config }));
  }

  updateSettings() {
    this.dom.defaultPackageMenu.value = this.config.defaultPackageMenu;

    const warnings = new Set(this.config.ignore.warnings);
    const flags = new Set(this.config.ignore.flags);

    for (const checkbox of this.dom.warningsCheckbox) {
      checkbox.checked = warnings.has(checkbox.getAttribute("value"));
    }

    for (const checkbox of this.dom.flagsCheckbox) {
      checkbox.checked = flags.has(checkbox.getAttribute("value"));
    }

    this.dom.showFriendlyDependenciesCheckbox.checked = this.config.showFriendlyDependencies;
  }
}
