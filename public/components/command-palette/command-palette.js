// Import Third-party Dependencies
import { LitElement, html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { warnings } from "@nodesecure/js-x-ray/warnings";

// Import Internal Dependencies
import { currentLang, vec2Distance } from "../../common/utils.js";
import { EVENTS } from "../../core/events.js";
import {
  FILTERS_NAME,
  FILTER_HAS_HELPERS,
  FILTER_MULTI_SELECT,
  PRESETS,
  computeMatches,
  getHelperValues
} from "./filters.js";
import { FLAG_IGNORE_ITEMS } from "../../common/flags.js";
import { commandPaletteStyles } from "./command-palette-styles.js";
import {
  renderFlagPanel,
  renderRangePanel,
  renderListPanel,
  renderFilterList,
  renderPresets,
  renderActions,
  renderIgnorePanel,
  renderResults
} from "./command-palette-panels.js";
import "./search-chip.js";

// CONSTANTS
const kActions = [
  { id: "toggle_theme", shortcut: "t" },
  { id: "reset_view", shortcut: "r" },
  { id: "copy_packages", shortcut: "c" },
  { id: "export_payload", shortcut: "e" }
];
const kWarningItems = Object.keys(warnings)
  .map((id) => {
    return { value: id, label: id.replaceAll("-", " ") };
  });

function resolveKbd(shortcut) {
  if (!shortcut) {
    return null;
  }

  const key = shortcut.toUpperCase();

  return navigator.userAgent.includes("Mac") ? `⌥${key}` : `Alt+${key}`;
}

class CommandPalette extends LitElement {
  #linker = null;
  #network = null;
  #packages = [];

  static styles = commandPaletteStyles;

  static properties = {
    open: { type: Boolean },
    inputValue: { type: String },
    activeFilter: { type: String },
    queries: { type: Array },
    selectedIndex: { type: Number },
    results: { type: Array }
  };

  #handleKeydown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      if (this.open) {
        this.#close();
      }
      else {
        this.#openModal();
      }

      return;
    }

    if (event.key === "Escape" && this.open) {
      this.#close();

      return;
    }

    if (this.open && event.altKey) {
      const action = kActions.find((a) => a.shortcut && `Key${a.shortcut.toUpperCase()}` === event.code);
      if (action) {
        event.preventDefault();
        this.#executeAction(action);
      }
    }
  };

  #init = ({ detail: { linker, packages, network } }) => {
    this.#linker = linker;
    this.#network = network;
    this.#packages = packages.map(({ id, name, version, flags }) => {
      return {
        id: String(id),
        name,
        version,
        flags
      };
    });
  };

  constructor() {
    super();
    this.open = false;
    this.inputValue = "";
    this.activeFilter = null;
    this.queries = [];
    this.selectedIndex = -1;
    this.results = [];
  }

  #onSettingsSaved = () => {
    if (this.open) {
      this.requestUpdate();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.#handleKeydown);
    window.addEventListener(EVENTS.COMMAND_PALETTE_INIT, this.#init);
    window.addEventListener(EVENTS.SETTINGS_SAVED, this.#onSettingsSaved);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#handleKeydown);
    window.removeEventListener(EVENTS.COMMAND_PALETTE_INIT, this.#init);
    window.removeEventListener(EVENTS.SETTINGS_SAVED, this.#onSettingsSaved);
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has("open") && this.open) {
      this.shadowRoot.querySelector("#cmd-input")?.focus();
    }
    if (changedProperties.has("selectedIndex") && this.selectedIndex >= 0) {
      this.shadowRoot.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
    }
  }

  #isNetworkViewActive() {
    return document.getElementById("network--view").classList.contains("hidden") === false;
  }

  #openModal() {
    if (this.#linker === null || !this.#isNetworkViewActive()) {
      return;
    }

    this.open = true;
  }

  #close() {
    this.open = false;
    this.inputValue = "";
    this.activeFilter = null;
    this.queries = [];
    this.selectedIndex = -1;
    this.results = [];
  }

  #getCurrentMatchingIds() {
    if (this.queries.length === 0) {
      return null;
    }

    let ids = null;
    for (const { filter, value } of this.queries) {
      const matches = computeMatches(this.#linker, filter, value);
      ids = ids === null ? matches : new Set([...ids].filter((id) => matches.has(id)));
    }

    return ids;
  }

  #computeLiveResults(filter, text) {
    const freshMatches = computeMatches(this.#linker, filter, text);
    const constraint = this.#getCurrentMatchingIds();
    const matchingIds = constraint === null
      ? freshMatches
      : new Set([...freshMatches].filter((id) => constraint.has(id)));

    this.results = this.#packages.filter((pkg) => matchingIds.has(pkg.id));
  }

  #addQuery(filter, value) {
    const freshMatches = computeMatches(this.#linker, filter, value);
    const constraint = this.#getCurrentMatchingIds();
    const matchingIds = constraint === null
      ? freshMatches
      : new Set([...freshMatches].filter((id) => constraint.has(id)));

    this.queries = [...this.queries, { filter, value, matchingIds }];
    this.results = this.#packages.filter((pkg) => matchingIds.has(pkg.id));
    this.inputValue = "";
    this.selectedIndex = -1;

    if (!FILTER_MULTI_SELECT.has(filter)) {
      this.activeFilter = null;
    }
  }

  #removeQuery(query) {
    this.queries = this.queries.filter((existing) => existing !== query);
    const constraint = this.#getCurrentMatchingIds();
    this.results = constraint === null
      ? []
      : this.#packages.filter((pkg) => constraint.has(pkg.id));
  }

  #removeQueryByValue(filter, value) {
    this.queries = this.queries.filter((query) => !(query.filter === filter && query.value === value));
    const constraint = this.#getCurrentMatchingIds();
    this.results = constraint === null
      ? []
      : this.#packages.filter((pkg) => constraint.has(pkg.id));
  }

  #removeLastQuery() {
    const last = this.queries[this.queries.length - 1];
    this.queries = this.queries.slice(0, -1);
    this.inputValue = `${last.filter}:${last.value}`;
    this.activeFilter = last.filter;
    this.selectedIndex = -1;

    const constraint = this.#getCurrentMatchingIds();
    if (constraint === null) {
      this.#computeLiveResults(last.filter, last.value);
    }
    else {
      this.results = this.#packages.filter((pkg) => constraint.has(pkg.id));
    }

    this.updateComplete.then(() => {
      this.shadowRoot.querySelector("#cmd-input")?.focus();
    });
  }

  #onInput(event) {
    const value = event.target.value;
    this.inputValue = value;
    this.selectedIndex = -1;

    const colonIndex = value.indexOf(":");
    if (colonIndex > 0) {
      const potentialFilter = value.slice(0, colonIndex);

      if (FILTERS_NAME.has(potentialFilter)) {
        this.activeFilter = potentialFilter;
        const text = value.slice(colonIndex + 1).trim();

        if (text.length > 0) {
          this.#computeLiveResults(potentialFilter, text);
        }
        else {
          this.results = [];
        }

        return;
      }
    }

    this.activeFilter = null;

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      this.#computeLiveResults("package", trimmed);
    }
    else {
      this.results = [];
    }
  }

  #onKeydown(event) {
    const helpers = this.#visibleHelpers;
    const total = helpers.length + this.results.length;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        this.selectedIndex = this.selectedIndex < total - 1 ? this.selectedIndex + 1 : 0;
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : total - 1;
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.#selectByIndex(this.selectedIndex);
        }
        else {
          this.#validateCurrentInput();
        }
        break;
      }
      case "Backspace": {
        if (this.inputValue === "" && this.queries.length > 0) {
          this.#removeLastQuery();
        }
        break;
      }
    }
  }

  #selectByIndex(index) {
    const helpers = this.#visibleHelpers;
    if (index < helpers.length) {
      this.#selectHelper(helpers[index]);
    }
    else {
      const result = this.results[index - helpers.length];
      this.#focusPackage(result.id);
    }
  }

  #selectHelper(helper) {
    if (helper.type === "filter") {
      this.inputValue = `${helper.value}:`;
      this.activeFilter = helper.value;
      this.selectedIndex = -1;
      this.results = [];
    }
    else {
      this.#addQuery(this.activeFilter, helper.value);
    }

    this.updateComplete.then(() => {
      this.shadowRoot.querySelector("#cmd-input")?.focus();
    });
  }

  #validateCurrentInput() {
    if (this.activeFilter !== null) {
      const text = this.inputValue.slice(this.activeFilter.length + 1).trim();
      if (text.length > 0) {
        this.#addQuery(this.activeFilter, text);
      }

      return;
    }

    if (this.inputValue.trim().length > 0) {
      this.#addQuery("package", this.inputValue.trim());

      return;
    }

    if (this.results.length > 0) {
      this.#focusMultiplePackages(this.results.map((result) => Number(result.id)));
    }
  }

  #focusPackage(id) {
    this.#network.focusNodeById(id);
    window.navigation.setNavByName("network--view");
    this.#close();
  }

  async #executeAction(action) {
    switch (action.id) {
      case "toggle_theme": {
        const nextTheme = window.settings.config.theme === "dark" ? "light" : "dark";
        window.dispatchEvent(new CustomEvent(EVENTS.SETTINGS_SAVED, {
          detail: { ...window.settings.config, theme: nextTheme }
        }));
        break;
      }
      case "reset_view":
        this.#network.network.emit("click", { nodes: [], edges: [] });
        this.#network.network.focus(0, {
          animation: true,
          scale: 0.35,
          offset: { x: 150, y: 0 }
        });
        break;
      case "copy_packages": {
        const packages = this.results.length > 0 ? this.results : this.#packages;
        const text = packages.map((pkg) => `${pkg.name}@${pkg.version}`).join("\n");
        try {
          await navigator.clipboard.writeText(text);
        }
        catch (error) {
          console.error(error);
        }
        break;
      }
      case "export_payload": {
        try {
          const res = await fetch("/data");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "nsecure-result.json";
          anchor.click();
          URL.revokeObjectURL(url);
        }
        catch (error) {
          console.error(error);
        }
        break;
      }
    }

    this.#close();
  }

  #toggleIgnore(type, value) {
    const ignoreSet = window.settings.config.ignore[type];
    if (ignoreSet.has(value)) {
      ignoreSet.delete(value);
    }
    else {
      ignoreSet.add(value);
    }

    const config = window.settings.config;
    fetch("/config", {
      method: "put",
      body: JSON.stringify({
        ...config,
        ignore: {
          warnings: [...config.ignore.warnings],
          flags: [...config.ignore.flags]
        }
      }),
      headers: { "content-type": "application/json" }
    }).catch(console.error);

    window.dispatchEvent(new CustomEvent(EVENTS.SETTINGS_SAVED, {
      detail: {
        ...config,
        ignore: {
          warnings: config.ignore.warnings,
          flags: config.ignore.flags
        }
      }
    }));

    this.requestUpdate();
  }

  #getEmptyQueryMessage() {
    const i18n = window.i18n[currentLang()].search_command;
    if (this.queries.length === 1) {
      const { filter, value } = this.queries[0];
      const preset = PRESETS.find((preset) => preset.filter === filter && preset.value === value);
      if (preset) {
        return i18n[`preset_empty_${preset.id}`] ?? i18n.empty_after_filter;
      }
    }

    return i18n.empty_after_filter;
  }

  #focusMultiplePackages(nodeIds) {
    window.navigation.setNavByName("network--view");
    this.#network.highlightMultipleNodes(nodeIds);
    window.locker.lock();

    const currentSelectedNode = window.networkNav.currentNodeParams;
    const shouldMove = !currentSelectedNode || !nodeIds.includes(currentSelectedNode.nodes[0]);
    if (shouldMove) {
      const origin = this.#network.network.getViewPosition();
      const closestNode = nodeIds
        .map((id) => {
          return { id, pos: this.#network.network.getPosition(id) };
        })
        .reduce((nodeA, nodeB) => (vec2Distance(origin, nodeA.pos) < vec2Distance(origin, nodeB.pos) ? nodeA : nodeB));

      const scale = nodeIds.length > 3 ? 0.25 : 0.35;
      this.#network.network.focus(closestNode.id, { animation: true, scale });
    }

    this.#close();
  }

  get #visibleHelpers() {
    if (this.activeFilter === null) {
      const text = this.inputValue.toLowerCase();

      const filterHints = window.i18n[currentLang()].search_command.filter_hints;

      return [...FILTERS_NAME]
        .filter((filterName) => text === "" || filterName.startsWith(text))
        .map((filterName) => {
          return { value: filterName, display: `${filterName}:`, hint: filterHints[filterName], type: "filter" };
        });
    }

    if (!FILTER_HAS_HELPERS.has(this.activeFilter)) {
      return [];
    }

    const searchText = this.inputValue.slice(this.activeFilter.length + 1).toLowerCase();
    const allValues = getHelperValues(this.#linker, this.activeFilter);

    return allValues
      .filter((helper) => searchText === "" || helper.display.toLowerCase().includes(searchText))
      .map((helper) => {
        return { ...helper, type: "value" };
      });
  }

  #renderActiveFilterPanel(helpers) {
    const panelProps = {
      linker: this.#linker,
      queries: this.queries,
      inputValue: this.inputValue,
      activeFilter: this.activeFilter,
      selectedIndex: this.selectedIndex,
      onAdd: (filter, value) => this.#addQuery(filter, value),
      onRemove: (filter, value) => this.#removeQueryByValue(filter, value)
    };

    switch (this.activeFilter) {
      case "flag":
        return renderFlagPanel(panelProps);
      case "size":
      case "version":
        return renderRangePanel(panelProps);
      default:
        return helpers.length > 0 ? renderListPanel({ ...panelProps, helpers }) : nothing;
    }
  }

  #resolveActions() {
    const i18n = window.i18n[currentLang()].search_command;
    const currentTheme = window.settings?.config?.theme ?? "light";
    const targetTheme = currentTheme === "dark" ? "light" : "dark";
    const copyCount = this.results.length > 0 ? this.results.length : this.#packages.length;

    return kActions.map((action) => {
      let label;
      switch (action.id) {
        case "toggle_theme":
          label = i18n[`action_toggle_theme_to_${targetTheme}`];
          break;
        case "reset_view":
          label = i18n.action_reset_view;
          break;
        case "copy_packages":
          label = `${i18n.action_copy_packages} (${copyCount})`;
          break;
        case "export_payload":
          label = i18n.action_export_payload;
          break;
        default:
          label = action.id;
      }

      return { ...action, label, kbd: resolveKbd(action.shortcut) };
    });
  }

  render() {
    if (!this.open) {
      return nothing;
    }

    const i18n = window.i18n[currentLang()].search_command;
    const helpers = this.#visibleHelpers;
    const isPanelMode = this.activeFilter !== null;
    const isEmpty = helpers.length === 0 && this.results.length === 0 && this.inputValue.length > 0;
    const isEmptyAfterQuery = this.queries.length > 0 && this.results.length === 0 && this.inputValue === "";
    const showRichPlaceholder = this.inputValue === "" && this.queries.length === 0;
    const showRefinePlaceholder = this.inputValue === "" && this.queries.length > 0;
    const helperPanel = helpers.length > 0
      ? renderFilterList({
        helpers,
        selectedIndex: this.selectedIndex,
        onSelect: (helper) => this.#selectHelper(helper)
      })
      : nothing;

    return html`
      <div class="backdrop" @click=${this.#close}>
        <div
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Package search"
          @click=${(event) => event.stopPropagation()}
        >
          <div class="search-header">
            <div class="search-input-row">
              ${this.queries.length > 0 ? html`
                <div class="chips">
                  ${repeat(this.queries, (query) => `${query.filter}:${query.value}`, (query) => html`
                    <search-chip
                      filter=${query.filter}
                      value=${query.value}
                      @remove=${() => this.#removeQuery(query)}
                    ></search-chip>
                  `)}
                </div>
              ` : nothing}
              <div class="input-wrapper">
                <input
                  id="cmd-input"
                  type="text"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  .value=${this.inputValue}
                  @input=${this.#onInput}
                  @keydown=${this.#onKeydown}
                />
                ${showRichPlaceholder ? html`
                  <div class="cmd-placeholder">
                    <span>${i18n.placeholder}</span>
                    <span>(${i18n.placeholder_filter_hint}</span>
                    <code>flag:</code><span>,</span>
                    <code>version:</code><span>,</span>
                    <code>license:</code><span>...)</span>
                  </div>
                ` : nothing}
                ${showRefinePlaceholder ? html`
                  <div class="cmd-placeholder">${i18n.placeholder_refine}</div>
                ` : nothing}
              </div>
            </div>
          </div>

          <div class="panel">
            ${isPanelMode ? this.#renderActiveFilterPanel(helpers) : helperPanel}
            ${showRichPlaceholder ? renderPresets({
              presets: PRESETS,
              onApply: (preset) => this.#addQuery(preset.filter, preset.value)
            }) : nothing}
            ${(showRichPlaceholder || showRefinePlaceholder) ? renderActions({
              actions: this.#resolveActions(),
              onExecute: (action) => this.#executeAction(action)
            }) : nothing}
            ${showRichPlaceholder ? renderIgnorePanel({
              title: i18n.section_ignore_flags,
              items: FLAG_IGNORE_ITEMS,
              ignored: window.settings?.config?.ignore?.flags ?? new Set(),
              onToggle: (value) => this.#toggleIgnore("flags", value)
            }) : nothing}
            ${showRichPlaceholder ? renderIgnorePanel({
              title: i18n.section_ignore_warnings,
              items: kWarningItems,
              ignored: window.settings?.config?.ignore?.warnings ?? new Set(),
              onToggle: (value) => this.#toggleIgnore("warnings", value)
            }) : nothing}
            ${renderResults({
              results: this.results,
              selectedIndex: this.selectedIndex,
              helperCount: helpers.length,
              onFocus: (id) => this.#focusPackage(id)
            })}
            ${isEmpty ? html`<div class="empty-state">${i18n.empty}</div>` : nothing}
            ${isEmptyAfterQuery ? html`<div class="empty-state">${this.#getEmptyQueryMessage()}</div>` : nothing}
          </div>

          <div class="search-footer">
            <span><kbd>↑↓</kbd> ${i18n.nav_navigate}</span>
            <span><kbd>↵</kbd> ${i18n.nav_select}</span>
            <span><kbd>⌫</kbd> ${i18n.nav_remove}</span>
            <span><kbd>Esc</kbd> ${i18n.nav_close}</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("command-palette", CommandPalette);
