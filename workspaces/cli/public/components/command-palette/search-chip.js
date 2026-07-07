// Import Third-party Dependencies
import { LitElement, html, css } from "lit";

class SearchChip extends LitElement {
  static styles = css`
:host {
  --sc-chip-bg: #e2e8f0;
  --sc-chip-filter: #3722af;
  --sc-chip-value: #64748b;
  --sc-chip-remove: #94a3b8;

  display: inline-flex;
}

:host-context(body.dark) {
  --sc-chip-bg: #37474f;
  --sc-chip-filter: #e1f5fe;
  --sc-chip-value: #b0bec5;
  --sc-chip-remove: #b0bec5;
}

.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--sc-chip-bg);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-family: mononoki, monospace;
}

.chip b {
  color: var(--sc-chip-filter);
}

.chip span {
  color: var(--sc-chip-value);
}

.chip-remove {
  background: none;
  border: none;
  color: var(--sc-chip-remove);
  cursor: pointer;
  padding: 0 2px;
  font-size: 14px;
  line-height: 1;
}

.chip-remove:hover {
  color: #ef5350;
}
`;

  static properties = {
    filter: { type: String },
    value: { type: String }
  };

  #onRemove = () => {
    this.dispatchEvent(new CustomEvent("remove", { bubbles: true, composed: true }));
  };

  render() {
    return html`
      <div class="chip">
        <b>${this.filter}:</b>
        <span>${this.value}</span>
        <button class="chip-remove" @click=${this.#onRemove}>×</button>
      </div>
    `;
  }
}

customElements.define("search-chip", SearchChip);
