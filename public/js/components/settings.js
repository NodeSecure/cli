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
      ignore: { flags: [], warnings: [] }
    };

    for (const checkbox of this.dom.warningsCheckbox) {
      if (checkbox.checked) {
        newConfig.ignore.warnings.push(checkbox.getAttribute("value"));
      }
    }

    for (const checkbox of this.dom.flagsCheckbox) {
      if (checkbox.checked) {
        newConfig.ignore.flags.push(checkbox.getAttribute("value"));
      }
    }

    await fetch("/config", {
      method: "put",
      body: JSON.stringify(newConfig),
      headers: {
        "content-type": "application/json"
      }
    });
    this.config = newConfig;
    this.saveButton.classList.add("disabled");
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
