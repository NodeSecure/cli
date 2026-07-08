// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { EVENTS } from "../../core/events.js";
import "../expandable/expandable.js";

class Gauge extends LitElement {
  static styles = css`
.gauge {
  display: flex;
  flex-direction: column;
}

.gauge>.line {
  display: flex;
  flex-direction: column;
  color: #546884;
  padding: 0 10px;
  border-radius: 4px;
}

.dark >.line {
  color: white;
}

.gauge>.line.clickable:hover {
  background: linear-gradient(to bottom,  rgb(255 255 255 / 100%) 0%,rgb(255 255 255 / 0%) 100%);
  cursor: pointer;
}

.dark >.line.clickable:hover {
  background: var(--dark-theme-primary-color);
}

.gauge>.line+.line {
  margin-top: 5px;
}

.gauge>.line>.line--column {
  display: flex;
  height: 24px;
  align-items: center;
  justify-content: flex-end;
}

.gauge>.line>.line--column span {
  width: 30px;
  flex-shrink: 0;
  text-align: right;
  font-family: mononoki;
  color: var(--secondary-darker);
}

.gauge>.line>.line--column.border-bottom {
  border-bottom: 1px solid #8080803d;
  padding-bottom: 5px;
}

.gauge .item-name {
  width: 130px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  font-size: 14px;
  letter-spacing: 1px;
}

.gauge .gauge--bar {
  flex-grow: 1;
  margin: 0 10px;
  background: #e1e4e6;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.gauge .gauge--bar >.usage {
  height: inherit;
  background-color: var(--secondary-darker);
}

.gauge .chip {
  font-family: mononoki;
  background: #8dabe536;
  border-radius: 8px;
  font-size: 14px;
  padding: 3px 5px;
}

.gauge .chip:last-child {
  margin-right: 30px;
}

.gauge .chip + .chip {
  margin-left: 10px;
}
`;

  static properties = {
    data: { type: Object },
    maxLength: { type: Number },
    isClosed: { type: Boolean },
    theme: { type: String }
  };

  constructor() {
    super();
    this.data = [];
    this.maxLength = 8;
    this.isClosed = true;
    this.settingsChanged = ({ detail: { theme } }) => {
      if (theme !== this.theme) {
        this.theme = theme;
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
    super.disconnectedCallback();
  }

  render() {
    const hideItems = this.data.length > this.maxLength;
    const length = this.data.reduce((prev, curr) => prev + curr.value, 0);

    return html`<div class="gauge ${this.theme}">
      ${repeat(this.data.filter(({ value }, i) => value !== 0 && (!hideItems || !this.isClosed || i < this.maxLength)),
          (item) => item,
          ({ name, value, link = null, chips = null }) => html`${this.#createLine({ text: name, value, chips, link, length })}`)
      }
      ${when(hideItems,
        () => html`<expandable-span .isClosed=${this.isClosed} .onToggle=${() => {
          this.isClosed = !this.isClosed;
        }}></expandable-span>`,
        () => nothing)}
    </div>`;
  }

  #createLine({
    text, value, chips, link, length
  }) {
    const lineColumn = html`
    <div class="line--column">
        <p class="item-name">${text}</p>
        ${this.#createGaugeBar(this.#pourcentFromValue(value, length))}
        <span>${value}</span>
    </div>
    ${when(chips,
      () => html`<div class="line--column border-bottom">${this.#createChips(chips)}</div>`,
      () => nothing)}
`;

    return html`
    ${when(link !== null,
      () => html`
    <div class="clickable line" @click=${() => {
      window.open(link, "_blank");
    }}>
      ${lineColumn}
    </div>
    `,
      () => html`
    <div class="line">
      ${lineColumn}
    </div>
    `)}
    `;
  }

  #createChips(chips) {
    return html`
    ${repeat(chips,
      (chip) => chip,
      (chip) => html`<div class="chip">${chip}</div>`)}
`;
  }

  #createGaugeBar(percent) {
    return html`
    <div class="gauge--bar">
      <div class="usage" style="width: ${percent}%"></div>
    </div>`;
  }

  #pourcentFromValue(value, length) {
    return Math.round((value / length) * 100);
  }
}

customElements.define("gauge-bar", Gauge);
