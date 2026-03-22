// Import Third-party Dependencies
import { css } from "lit";

// Import Internal Dependencies
import { scrollbarStyle } from "../../../common/scrollbar-style.js";

export const searchViewStyles = [
  scrollbarStyle,
  css`
    /*
     * Fontello icon base rules, shadow DOM does not inherit global CSS rules
     */
    [class^="icon-"]::before,
    [class*=" icon-"]::before {
      font-family: fontello;
      font-style: normal;
      font-weight: normal;
      display: inline-block;
      text-decoration: inherit;
      width: 1em;
      text-align: center;
      font-variant: normal;
      text-transform: none;
      line-height: 1em;
      speak: never;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .icon-search::before { content: '\\e807'; }

    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      overflow-y: auto;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 640px;
      padding: clamp(40px, 18vh, 130px) 20px 48px;
      gap: 16px;
    }

    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
      margin-bottom: 8px;
    }

    .hero-icon {
      font-size: 44px;
      filter: invert(64%) sepia(100%) saturate(2094%) hue-rotate(241deg) brightness(67%) contrast(114%);
      opacity: 0.8;
      margin-right: 0;
    }

    .hero-icon::before {
      margin-right: 0;
      width: auto;
    }

    .hero-title {
      font-family: mononoki, monospace;
      font-size: 26px;
      font-weight: bold;
      color: var(--primary, #3722af);
      margin: 0;
      letter-spacing: 0.3px;
    }

    :host-context(body.dark) .hero-title {
      color: var(--dark-theme-secondary-color, #e2e8f0);
    }

    .hero-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
      text-align: center;
      line-height: 1.5;
    }

    form {
      width: 100%;
    }

    .search-bar {
      display: flex;
      align-items: center;
      width: 100%;
      border-radius: 10px;
      background: white;
      box-shadow: 0 4px 24px #3722af18, 0 1px 3px #3722af0a;
      border: 1.5px solid #e2e8f0;
      overflow: hidden;
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .search-bar:focus-within {
      box-shadow: 0 4px 32px #3722af28, 0 1px 4px #3722af14;
      border-color: #3722af;
    }

    :host-context(body.dark) .search-bar {
      background: var(--dark-theme-gray);
      border-color: #37474f;
      box-shadow: 0 4px 24px #00000030;
    }

    :host-context(body.dark) .search-bar:focus-within {
      border-color: var(--primary-lighter);
      box-shadow: 0 4px 32px #5b44da40;
    }

    input {
      flex: 1;
      padding: 14px 16px;
      border: none;
      font-size: 16px;
      font-family: mononoki, monospace;
      color: #1e293b;
      background: transparent;
      outline: none;
      min-width: 0;
    }

    :host-context(body.dark) input {
      color: var(--dark-theme-secondary-color, #eceff1);
    }

    input::placeholder {
      color: #94a3b8;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2.5px solid #dbdcef;
      border-right-color: #474bff;
      animation: spin 1s linear infinite;
      flex-shrink: 0;
      margin-right: 4px;
    }

    :host-context(body.dark) .spinner-small {
      border-color: var(--dark-theme-accent-lighter);
      border-right-color: var(--dark-theme-accent-darker);
    }

    @keyframes spin {
      to { transform: rotate(1turn); }
    }

    .scan-button {
      flex-shrink: 0;
      margin: 6px;
      padding: 10px 20px;
      border-radius: 7px;
      border: none;
      background: #3722af;
      color: white;
      font-family: mononoki, monospace;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }

    .scan-button:hover {
      background: #2a1a8a;
    }

    .scan-button:active {
      transform: scale(0.97);
    }

    :host-context(body.dark) .scan-button {
      background: #4f3cc0;
    }

    :host-context(body.dark) .scan-button:hover {
      background: #5d48d4;
    }

    .hint {
      color: rgb(239 126 126);
      text-align: center;
      font-style: italic;
      font-size: 14px;
      width: 100%;
    }

    .not-found {
      width: 100%;
      padding: 16px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
      font-family: mononoki, monospace;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
    }

    :host-context(body.dark) .not-found {
      background: var(--dark-theme-primary-lighter);
      border-color: #37474f;
      color: #546e7a;
    }

    .results {
      width: 100%;
      border-radius: 6px;
      max-height: 340px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      background: white;
    }

    :host-context(body.dark) .results {
      background: var(--dark-theme-primary-lighter);
      border-color: #37474f;
    }

    .result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      cursor: default;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.1s;
    }

    :host-context(body.dark) .result {
      border-bottom-color: #263238;
    }

    .result:last-child {
      border-bottom: none;
    }

    .result:hover {
      background: #eff4ff;
    }

    :host-context(body.dark) .result:hover {
      background: #1a2744;
    }

    .result.exact {
      border-left: 3px solid #3722af;
      padding-left: 11px;
    }

    :host-context(body.dark) .result.exact {
      border-left-color: var(--primary-lighter);
    }

    .result-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .result-name {
      font-family: mononoki, monospace;
      font-size: 14px;
      font-weight: bold;
      color: #3722af;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host-context(body.dark) .result-name {
      color: var(--primary-lighter, #a5b4fc);
    }

    .result-name:hover {
      text-decoration: underline;
    }

    .result-description {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: Roboto, sans-serif;
    }

    :host-context(body.dark) .result-description {
      color: #546e7a;
    }

    .version-select {
      font-family: mononoki, monospace;
      font-size: 12px;
      font-weight: bold;
      color: #1976d2;
      cursor: pointer;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 4px;
      padding: 3px 6px;
      flex-shrink: 0;
      width: 80px;
      min-width: 80px;
    }

    .version-select:disabled {
      opacity: 0.5;
      cursor: wait;
    }

    :host-context(body.dark) .version-select {
      background: #263238;
      border-color: #37474f;
      color: #ffeb3b;
    }

    .cache-section {
      display: flex;
      flex-direction: column;
      width: 100%;
      border: 1px solid #54688424;
      padding: 10px;
      border-radius: 4px;
      max-height: calc(50vh - 80px);
      overflow: auto;
    }

    .cache-title {
      font-family: mononoki, monospace;
      color: #546884;
      font-size: 12px;
      font-weight: bold;
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    :host-context(body.dark) .cache-title {
      color: var(--dark-theme-secondary-lighter);
    }

    .cache-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: 6px;
      background: #54688419;
      padding: 7px 10px;
      border-radius: 3px;
      cursor: pointer;
      transition: background 0.12s;
    }

    :host-context(body.dark) .cache-item {
      background: #0b031f71;
    }

    .cache-item:hover {
      background: #5468842a;
    }

    :host-context(body.dark) .cache-item:hover {
      background: #1a0a4080;
    }

    .cache-item-name {
      font-family: mononoki, monospace;
      font-size: 14px;
      color: var(--primary);
    }

    :host-context(body.dark) .cache-item-name {
      color: var(--secondary-darker);
    }

    .cache-item-name b {
      background: #f57c00;
      color: white;
      font-weight: bold;
      font-size: 11px;
      margin-left: 5px;
      padding: 0 5px;
      border-radius: 2px;
      font-family: Roboto, sans-serif;
      letter-spacing: 1px;
    }

    .cache-remove {
      border: none;
      cursor: pointer;
      color: #fff5dc;
      background: #ff3434e2;
      margin-left: 8px;
      border-radius: 50%;
      text-shadow: 1px 1px 10px #000;
      font-weight: bold;
      width: 20px;
      height: 20px;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 0;
    }

    .scan-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 300px;
    }

    .scan-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
    }

    .scan-rings {
      position: relative;
      width: 100px;
      height: 100px;
    }

    .scan-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid #3722af;
      opacity: 0;
      animation: pulse-ring 2s ease-out infinite;
    }

    :host-context(body.dark) .scan-ring {
      border-color: #6f60d9;
    }

    .scan-ring:nth-child(2) { animation-delay: 0.65s; }
    .scan-ring:nth-child(3) { animation-delay: 1.3s; }

    @keyframes pulse-ring {
      0% { transform: scale(0.2); opacity: 0.9; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    .scan-icon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      filter: invert(64%) sepia(100%) saturate(2094%) hue-rotate(241deg) brightness(67%) contrast(114%);
      animation: icon-pulse 2s ease-in-out infinite;
    }

    .scan-icon [class^="icon-"]::before,
    .scan-icon [class*=" icon-"]::before {
      margin-right: 0;
      width: auto;
    }

    @keyframes icon-pulse {
      0%, 100% { opacity: 0.5; transform: scale(0.92); }
      50% { opacity: 1; transform: scale(1.08); }
    }

    .scan-spec {
      font-family: mononoki, monospace;
      font-size: 22px;
      font-weight: bold;
      color: #3722af;
      letter-spacing: 0.5px;
      text-align: center;
      max-width: 80vw;
      overflow-wrap: break-word;
    }

    :host-context(body.dark) .scan-spec {
      color: #a5b4fc;
    }

    .scan-label {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-size: 14px;
      color: #94a3b8;
      font-family: mononoki, monospace;
      letter-spacing: 0.5px;
    }

    .scan-dot {
      animation: dot-blink 1.4s ease-in-out infinite;
      opacity: 0;
      font-size: 18px;
      line-height: 1;
    }

    .scan-dot:nth-child(2) { animation-delay: 0.2s; }
    .scan-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes dot-blink {
      0%, 70%, 100% { opacity: 0; }
      35% { opacity: 1; }
    }
  `
];
