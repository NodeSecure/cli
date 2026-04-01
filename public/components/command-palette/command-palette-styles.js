// Import Third-party Dependencies
import { css } from "lit";

// Import Internal Dependencies
import { scrollbarStyle } from "../../common/scrollbar-style.js";

export const commandPaletteStyles = [
  scrollbarStyle,
  css`
:host {
  --sc-bg: #fff;
  --sc-bg-item: #f8fafc;
  --sc-bg-hover: #eff4ff;
  --sc-backdrop: rgb(0 0 0 / 40%);
  --sc-border: #e2e8f0;
  --sc-border-subtle: #f1f5f9;
  --sc-shadow: 0 20px 60px rgb(0 0 0 / 20%);
  --sc-text: #1e293b;
  --sc-text-muted: #94a3b8;
  --sc-text-accent: #3722af;
  --sc-text-hint: #94a3b8;
  --sc-text-version: #1976d2;
  --sc-caret: #3722af;
  --sc-flag-bg: #f8fafc;
  --sc-flag-active-bg: #eff4ff;
  --sc-flag-active-border: #3722af;
  --sc-flag-active-text: #3722af;
  --sc-flag-count-bg: #e2e8f0;
  --sc-flag-count-text: #64748b;
  --sc-flag-active-count-bg: #c7d7fe;
  --sc-flag-active-count-text: #3722af;
  --sc-code-bg: #f1f5f9;
  --sc-code-border: #e2e8f0;
  --sc-code-text: #475569;
  --sc-kbd-bg: #f1f5f9;
  --sc-kbd-text: #475569;
  --sc-count-bg: #f1f5f9;

  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
}

:host-context(body.dark) {
  --sc-bg: #1e2030;
  --sc-bg-item: #263238;
  --sc-bg-hover: #1a2744;
  --sc-backdrop: rgb(0 0 0 / 60%);
  --sc-border: #37474f;
  --sc-border-subtle: #263238;
  --sc-shadow: 0 20px 60px rgb(0 0 0 / 60%);
  --sc-text: #eceff1;
  --sc-text-muted: #546e7a;
  --sc-text-accent: #e1f5fe;
  --sc-text-hint: #546e7a;
  --sc-text-version: #ffeb3b;
  --sc-caret: #5c6bc0;
  --sc-flag-bg: #263238;
  --sc-flag-active-bg: #0d2137;
  --sc-flag-active-border: #1976d2;
  --sc-flag-active-text: #e1f5fe;
  --sc-flag-count-bg: #37474f;
  --sc-flag-count-text: #78909c;
  --sc-flag-active-count-bg: #1565c0;
  --sc-flag-active-count-text: #b3d4ff;
  --sc-code-bg: #263238;
  --sc-code-border: #37474f;
  --sc-code-text: #78909c;
  --sc-kbd-bg: #37474f;
  --sc-kbd-text: #b0bec5;
  --sc-count-bg: #37474f;
}

.backdrop {
  position: fixed;
  inset: 0;
  background: var(--sc-backdrop);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  pointer-events: all;
}

.dialog {
  background: var(--sc-bg);
  border: 1px solid var(--sc-border);
  border-radius: 8px;
  width: 640px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--sc-shadow);
  pointer-events: all;
}

.search-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--sc-border);
}

.search-input-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.input-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
}

#cmd-input {
  width: 100%;
  background: none;
  border: none;
  outline: none;
  color: var(--sc-text);
  font-size: 15px;
  font-family: mononoki, monospace;
  caret-color: var(--sc-caret);
}

.cmd-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  color: var(--sc-text-muted);
  font-size: 15px;
  font-family: mononoki, monospace;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  gap: 4px;
}

.cmd-placeholder code {
  background: var(--sc-code-bg);
  border: 1px solid var(--sc-code-border);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--sc-code-text);
  font-family: mononoki, monospace;
}

.panel {
  overflow-y: auto;
  flex: 1;
}

.section {
  padding: 8px 0;
}

.section + .section {
  border-top: 1px solid var(--sc-border-subtle);
}

.section-title {
  padding: 4px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--sc-text-muted);
  font-family: Roboto, sans-serif;
}

.section-title .count {
  background: var(--sc-count-bg);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  margin-left: 4px;
}

.helper-item,
.result-item {
  display: flex;
  align-items: center;
  padding: 7px 16px;
  cursor: pointer;
  font-size: 13px;
  gap: 8px;
  color: var(--sc-text);
  font-family: mononoki, monospace;
}

.helper-item:hover,
.result-item:hover,
.helper-item.selected,
.result-item.selected {
  background: var(--sc-bg-hover);
}

.helper-item b {
  color: var(--sc-text-accent);
  min-width: 120px;
}

.helper-item .hint {
  color: var(--sc-text-hint);
  font-size: 12px;
}

.result-flags {
  font-size: 16px;
  min-width: 24px;
}

.result-name {
  flex: 1;
}

.result-version {
  color: var(--sc-text-version);
  font-size: 12px;
}

.flag-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px 16px 12px;
}

.flag-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid var(--sc-border);
  background: var(--sc-flag-bg);
  color: var(--sc-text-muted);
  transition: border-color 0.12s, background 0.12s, color 0.12s;
  min-width: 0;
}

.flag-chip:hover {
  border-color: var(--sc-text-muted);
  color: var(--sc-text);
}

.flag-chip.flag-active {
  background: var(--sc-flag-active-bg);
  border-color: var(--sc-flag-active-border);
  color: var(--sc-flag-active-text);
}

.flag-emoji {
  font-size: 14px;
  flex-shrink: 0;
}

.flag-name {
  font-size: 11px;
  font-family: mononoki, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.flag-count {
  font-size: 10px;
  background: var(--sc-flag-count-bg);
  border-radius: 10px;
  padding: 1px 5px;
  flex-shrink: 0;
  color: var(--sc-flag-count-text);
}

.flag-chip.flag-active .flag-count {
  background: var(--sc-flag-active-count-bg);
  color: var(--sc-flag-active-count-text);
}

.range-panel {
  padding: 4px 16px 12px;
}

.range-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.range-preset {
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: mononoki, monospace;
  background: var(--sc-bg-item);
  border: 1px solid var(--sc-border);
  color: var(--sc-text-muted);
  transition: border-color 0.12s, color 0.12s;
}

.range-preset:hover {
  border-color: var(--sc-text-muted);
  color: var(--sc-text);
}

.range-hint {
  font-size: 11px;
  color: var(--sc-text-hint);
  font-family: mononoki, monospace;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  cursor: pointer;
  font-size: 13px;
  font-family: mononoki, monospace;
  color: var(--sc-text-muted);
}

.list-item:hover,
.list-item.selected {
  background: var(--sc-bg-hover);
  color: var(--sc-text);
}

.list-count {
  font-size: 10px;
  color: var(--sc-text-hint);
  background: var(--sc-bg-item);
  border-radius: 10px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--sc-text-muted);
  font-size: 13px;
  font-family: Roboto, sans-serif;
}

.search-footer {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid var(--sc-border);
  font-size: 11px;
  color: var(--sc-text-muted);
  font-family: Roboto, sans-serif;
  flex-shrink: 0;
}

kbd {
  background: var(--sc-kbd-bg);
  border-radius: 3px;
  padding: 1px 5px;
  font-family: inherit;
  font-size: 11px;
  color: var(--sc-kbd-text);
}

.action-kbd {
  margin-left: 6px;
  opacity: 0.7;
  border: 1px solid var(--sc-border);
}
`
];
