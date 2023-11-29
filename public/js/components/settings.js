// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

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
      flagsCheckbox: document.querySelectorAll("input[name='flags']")
    }

    this.saveButton = document.querySelector(".save");
    this.saveButton.addEventListener("click", () => this.saveSettings().catch(console.error));
    this.saveButton.classList.add("disabled");

    this.dom.defaultPackageMenu.addEventListener("change", () => this.enableSaveButton());
    for (const checkbox of [...this.dom.warningsCheckbox, ...this.dom.flagsCheckbox]) {
      checkbox.addEventListener("change", () => this.enableSaveButton());
    }
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
      ignore: { flags: new Set(), warnings: new Set() }
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
  }
}
