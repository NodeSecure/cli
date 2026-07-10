// Import Third-party Dependencies
import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";

// Import Internal Dependencies
import * as utils from "../../common/utils.js";
import {
  FLAG_LIST,
  SIZE_PRESETS,
  VERSION_PRESETS,
  getFlagCounts,
  getFilterValueCounts
} from "./filters.js";

// CONSTANTS
const kListTitleKeys = {
  license: "section_licenses",
  ext: "section_extensions",
  builtin: "section_builtins",
  author: "section_authors",
  dep: "section_dep"
};

/**
 * @returns {Record<string, string>}
 */
function getSearchCommandI18n() {
  return /** @type {Record<string, string>} */ (/** @type {unknown} */ (utils.getI18n().search_command));
}

/**
 * @typedef {import("@nodesecure/vis-network").LinkerEntry} LinkerEntry
 * @typedef {{ filter: string, value: string }} SearchQuery
 * @typedef {{ display: string, value: string, hint?: string }} HelperValue
 */

/**
 * @param {{
 * linker: Map<number, LinkerEntry>,
 * queries: SearchQuery[],
 * inputValue: string,
 * onAdd: (filter: string, value: string) => void,
 * onRemove: (filter: string, value: string) => void
 * }} props
 */
export function renderFlagPanel({ linker, queries, inputValue, onAdd, onRemove }) {
  const i18n = getSearchCommandI18n();
  const flagCounts = getFlagCounts(linker);
  const activeFlags = new Set(
    queries
      .filter((query) => query.filter === "flag")
      .map((query) => query.value)
  );

  const searchText = inputValue.slice("flag:".length).toLowerCase();
  const visibleFlags = searchText === ""
    ? FLAG_LIST
    : FLAG_LIST.filter((flag) => flag.name.toLowerCase().includes(searchText));

  return html`
    <div class="section">
      <div class="section-title">${i18n.section_flags}</div>
      <div class="flag-grid">
        ${repeat(visibleFlags, (flag) => flag.name, (flag) => {
          const count = flagCounts.get(flag.name) ?? 0;
          const isActive = activeFlags.has(flag.name);

          return html`
            <div
              class=${classMap({ "flag-chip": true, "flag-active": isActive })}
              title=${flag.name}
              @click=${() => (isActive ? onRemove("flag", flag.name) : onAdd("flag", flag.name))}
            >
              <span class="flag-emoji">${flag.emoji}</span>
              <span class="flag-name">${flag.name}</span>
              ${count > 0 ? html`<span class="flag-count">${count}</span>` : nothing}
            </div>
          `;
        })}
      </div>
    </div>
  `;
}

/**
 * @param {{ activeFilter: string, onAdd: (filter: string, value: string) => void }} props
 */
export function renderRangePanel({ activeFilter, onAdd }) {
  const i18n = getSearchCommandI18n();
  const isSizeFilter = activeFilter === "size";
  const presets = isSizeFilter ? SIZE_PRESETS : VERSION_PRESETS;
  const title = isSizeFilter ? i18n.section_size : i18n.section_version;
  const hint = isSizeFilter ? i18n.hint_size : i18n.hint_version;

  return html`
    <div class="section">
      <div class="section-title">${title}</div>
      <div class="range-panel">
        <div class="range-presets">
          ${presets.map((preset) => html`
            <button
              class="range-preset"
              @click=${() => onAdd(activeFilter, preset.value)}
            >${preset.label}</button>
          `)}
        </div>
        <div class="range-hint">${hint}</div>
      </div>
    </div>
  `;
}

/**
 * @param {{
 * linker: Map<number, LinkerEntry>,
 * activeFilter: string,
 * helpers: HelperValue[],
 * selectedIndex: number,
 * onAdd: (filter: string, value: string) => void
 * }} props
 */
export function renderListPanel({ linker, activeFilter, helpers, selectedIndex, onAdd }) {
  const i18n = getSearchCommandI18n();
  const counts = getFilterValueCounts(linker, activeFilter);
  const titleI18nKey = /** @type {Record<string, string>} */ (kListTitleKeys)[activeFilter];
  const title = i18n[titleI18nKey] ?? activeFilter;

  return html`
    <div class="section">
      <div class="section-title">${title}</div>
      ${repeat(helpers, (helper) => helper.value, (helper, i) => html`
        <div
          class=${classMap({ "list-item": true, selected: selectedIndex === i })}
          @click=${() => onAdd(activeFilter, helper.value)}
        >
          <span>${helper.display}</span>
          ${counts.has(helper.value) ? html`<span class="list-count">${counts.get(helper.value)}</span>` : nothing}
        </div>
      `)}
    </div>
  `;
}

/**
 * @param {{ helpers: HelperValue[], selectedIndex: number, onSelect: (helper: HelperValue) => void }} props
 */
export function renderFilterList({ helpers, selectedIndex, onSelect }) {
  const i18n = getSearchCommandI18n();

  return html`
    <div class="section">
      <div class="section-title">${i18n.section_filters}</div>
      ${repeat(helpers, (helper) => helper.value, (helper, i) => html`
        <div
          class=${classMap({ "helper-item": true, selected: selectedIndex === i })}
          @click=${() => onSelect(helper)}
        >
          <b>${helper.display}</b><span class="hint">${helper.hint}</span>
        </div>
      `)}
    </div>
  `;
}

/**
 * @param {{
 * presets: { id: string, filter: string, value: string }[],
 * onApply: (preset: { id: string, filter: string, value: string }) => void
 * }} props
 */
export function renderPresets({ presets, onApply }) {
  const i18n = getSearchCommandI18n();

  return html`
    <div class="section">
      <div class="section-title">${i18n.section_presets}</div>
      <div class="range-panel">
        <div class="range-presets">
          ${presets.map((preset) => html`
            <button
              class="range-preset"
              @click=${() => onApply(preset)}
            >${i18n[`preset_${preset.id}`]}</button>
          `)}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {{
 * actions: { id: string, label: string, kbd: string|null }[],
 * onExecute: (action: { id: string, label: string, kbd: string|null }) => void
 * }} props
 */
export function renderActions({ actions, onExecute }) {
  const i18n = getSearchCommandI18n();

  return html`
    <div class="section">
      <div class="section-title">${i18n.section_actions}</div>
      <div class="range-panel">
        <div class="range-presets">
          ${actions.map((action) => html`
            <button
              class="range-preset"
              @click=${() => onExecute(action)}
            >
              ${action.label}
              ${action.kbd ? html`<kbd class="action-kbd">${action.kbd}</kbd>` : nothing}
            </button>
          `)}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {{ title: string, items: Array<{value: string, label: string, emoji?: string}>, ignored: Set<string>, onToggle: Function }} props
 */
export function renderIgnorePanel({ title, items, ignored, onToggle }) {
  return html`
    <div class="section">
      <div class="section-title">${title}</div>
      <div class="flag-grid">
        ${repeat(items, (item) => item.value, (item) => {
          const isIgnored = ignored.has(item.value);

          return html`
            <div
              class=${classMap({ "flag-chip": true, "flag-active": isIgnored })}
              title=${item.value}
              @click=${() => onToggle(item.value)}
            >
              ${item.emoji ? html`<span class="flag-emoji">${item.emoji}</span>` : nothing}
              <span class="flag-name">${item.label}</span>
            </div>
          `;
        })}
      </div>
    </div>
  `;
}

/**
 * @param {{
 * results: { id: string, flags: string, name: string, version: string }[],
 * selectedIndex: number,
 * helperCount: number,
 * onFocus: (id: string) => void
 * }} props
 */
export function renderResults({ results, selectedIndex, helperCount, onFocus }) {
  if (results.length === 0) {
    return nothing;
  }

  const i18n = getSearchCommandI18n();

  return html`
    <div class="section">
      <div class="section-title">
        ${i18n.section_packages} <span class="count">${results.length}</span>
      </div>
      ${repeat(results, (result) => result.id, (result, i) => html`
        <div
          class=${classMap({ "result-item": true, selected: selectedIndex === helperCount + i })}
          @click=${() => onFocus(result.id)}
        >
          <span class="result-flags">${result.flags}</span>
          <span class="result-name">${result.name}</span>
          <b class="result-version">${result.version}</b>
        </div>
      `)}
    </div>
  `;
}
