// Import Third-party Dependencies
import { css } from "lit";

export const treeStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: mononoki, monospace;
  }

  [class^="icon-"]::before, [class*=" icon-"]::before {
    font-family: fontello;
    font-style: normal;
    font-weight: normal;
    display: inline-block;
    text-decoration: inherit;
    text-align: center;
    font-variant: normal;
    text-transform: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .icon-warning-empty::before { content: '\\e80f'; }

  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 40px;
    border-bottom: 1px solid rgb(55 34 175 / 15%);
    flex-shrink: 0;
  }

  :host-context(body.dark) .page-header {
    border-bottom-color: rgb(164 148 255 / 12%);
  }

  .page-header--title {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 23px;
    font-weight: 700;
  }

  .page-header--pkg {
    color: var(--primary-lighter, #5a44da);
  }

  :host-context(body.dark) .page-header--pkg {
    color: var(--secondary, #00d1ff);
  }

  .page-header--version {
    font-size: 17px;
    font-weight: 400;
    color: var(--secondary-darker, #1976d2);
  }

  :host-context(body.dark) .page-header--version {
    color: var(--dark-theme-secondary-color, #4f9ad1);
  }

  .page-header--stats {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .page-header--stat-badge {
    background: rgb(55 34 175 / 7%);
    border: 1px solid rgb(55 34 175 / 15%);
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 14px;
    color: var(--primary-lighter, #5a44da);
  }

  :host-context(body.dark) .page-header--stat-badge {
    background: rgb(164 148 255 / 7%);
    border-color: rgb(164 148 255 / 15%);
    color: var(--secondary, #00d1ff);
  }

  .page-header--modes {
    margin-left: auto;
    display: flex;
    border: 1px solid rgb(55 34 175 / 25%);
    border-radius: 6px;
    overflow: hidden;
  }

  :host-context(body.dark) .page-header--modes {
    border-color: rgb(164 148 255 / 20%);
  }

  .mode-btn {
    background: transparent;
    border: none;
    padding: 5px 14px;
    font-family: mononoki, monospace;
    font-size: 15px;
    color: #7a7595;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .mode-btn:hover {
    background: rgb(55 34 175 / 6%);
    color: var(--primary-lighter, #5a44da);
  }

  .mode-btn.active {
    background: var(--primary, #3722af);
    color: white;
  }

  :host-context(body.dark) .mode-btn.active {
    background: var(--dark-theme-secondary-darker, #262981);
    color: var(--secondary, #00d1ff);
  }

  .tree-card {
    border-radius: 6px;
    padding: 10px 12px;
    border: 1px solid rgb(55 34 175 / 20%);
    background: rgb(55 34 175 / 2%);
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  .tree-card:hover {
    border-color: var(--primary-lighter, #5a44da);
    background: rgb(55 34 175 / 7%);
  }

  :host-context(body.dark) .tree-card {
    border-color: rgb(164 148 255 / 15%);
    background: rgb(255 255 255 / 2%);
  }

  :host-context(body.dark) .tree-card:hover {
    border-color: rgb(164 148 255 / 40%);
    background: rgb(90 68 218 / 10%);
  }

  .tree-card.warn-moderate {
    background: rgb(249 115 22 / 8%);
    border-color: rgb(249 115 22 / 35%);
  }

  .tree-card.warn-moderate:hover {
    background: rgb(249 115 22 / 14%);
    border-color: rgb(249 115 22 / 55%);
  }

  :host-context(body.dark) .tree-card.warn-moderate {
    background: rgb(249 115 22 / 10%);
    border-color: rgb(249 115 22 / 30%);
  }

  .tree-card.warn-critical {
    background: rgb(220 38 38 / 10%);
    border-color: rgb(220 38 38 / 35%);
  }

  .tree-card.warn-critical:hover {
    background: rgb(220 38 38 / 16%);
    border-color: rgb(220 38 38 / 55%);
  }

  :host-context(body.dark) .tree-card.warn-critical {
    background: rgb(220 38 38 / 12%);
    border-color: rgb(220 38 38 / 30%);
  }

  .tree-card--root {
    border-style: dashed;
    align-self: start;
  }

  .tree-card--header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px;
  }

  .tree-card--name {
    font-size: 15px;
    font-weight: 600;
    color: var(--primary-darker, #261877);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  :host-context(body.dark) .tree-card--name {
    color: rgb(255 255 255 / 90%);
  }

  .tree-card--version {
    color: var(--secondary-darker, #1976d2);
    font-weight: 400;
    font-size: 14px;
  }

  :host-context(body.dark) .tree-card--version {
    color: var(--dark-theme-secondary-color, #4f9ad1);
  }

  .tree-card--provenance {
    display: inline-flex;
    align-items: center;
    color: #10b981;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
    cursor: help;
  }

  .tree-card--meta {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .tree-card--type {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--type-color, #6b7280);
    color: white;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .tree-card--flags {
    display: flex;
    gap: 2px;
  }

  .flag {
    cursor: help;
    font-size: 15px;
    line-height: 1;
  }

  .tree-card--stats {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: #7a7595;
    flex-wrap: wrap;
  }

  :host-context(body.dark) .tree-card--stats {
    color: rgb(255 255 255 / 45%);
  }

  .tree-card--separator {
    opacity: 0.4;
    user-select: none;
  }

  .tree-card--warnings {
    margin-left: auto;
    color: #f97316;
    font-weight: 600;
  }

  .tree-card.warn-critical .tree-card--warnings {
    color: #ef4444;
  }

  .tree-card--cyclic {
    font-size: 13px;
    color: #a855f7;
    margin-left: auto;
  }

  .tree-card--published-row {
    display: flex;
    margin-top: 2px;
  }

  .tree-card--published-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 13px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--published-color) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--published-color) 35%, transparent);
    color: var(--published-color);
  }

  .depth-container {
    display: flex;
    flex-direction: row;
    gap: 16px;
    padding: 24px 40px 40px;
    overflow: auto hidden;
    flex: 1;
    align-items: flex-start;
  }

  .depth-container::-webkit-scrollbar { height: 6px; }
  .depth-container::-webkit-scrollbar-track { background: transparent; }

  .depth-container::-webkit-scrollbar-thumb {
    background: rgb(55 34 175 / 30%);
    border-radius: 3px;
  }

  :host-context(body.dark) .depth-container::-webkit-scrollbar-thumb {
    background: rgb(164 148 255 / 30%);
  }

  .depth-column {
    flex-shrink: 0;
    width: 250px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .depth-column--header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--primary, #3722af);
    margin-bottom: 10px;
  }

  :host-context(body.dark) .depth-column--header {
    border-bottom-color: var(--dark-theme-secondary-color, #4f9ad1);
  }

  .depth-column--label {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-lighter, #5a44da);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  :host-context(body.dark) .depth-column--label {
    color: var(--secondary, #00d1ff);
  }

  .depth-column--count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary, #3722af);
    color: white;
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 14px;
    font-weight: bold;
  }

  .depth-column--cards {
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    flex: 1;
    padding-right: 4px;
  }

  .depth-column--cards::-webkit-scrollbar { width: 4px; }
  .depth-column--cards::-webkit-scrollbar-track { background: transparent; }

  .depth-column--cards::-webkit-scrollbar-thumb {
    background: rgb(55 34 175 / 30%);
    border-radius: 2px;
  }

  :host-context(body.dark) .depth-column--cards::-webkit-scrollbar-thumb {
    background: rgb(164 148 255 / 30%);
  }

  .tree-body {
    overflow: auto;
    flex: 1;
    padding: 24px 40px 40px;
  }

  .tree-body::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .tree-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .tree-body::-webkit-scrollbar-thumb {
    background: rgb(55 34 175 / 30%);
    border-radius: 3px;
  }

  :host-context(body.dark) .tree-body::-webkit-scrollbar-thumb {
    background: rgb(164 148 255 / 30%);
  }

  .tree-grid {
    display: grid;
    position: relative;
  }

  .tree-gap {
    pointer-events: none;
  }

  .connectors-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    z-index: 0;
  }
`;
