// Import Third-party Dependencies
import { LitElement, html, css } from "lit";

// Import Internal Dependencies
import { COLORS } from "../../../workspaces/vis-network/src/constants.js";
import { currentLang } from "../../common/utils.js";

class Legend extends LitElement {
  static properties = {
    isVisible: { type: Boolean }
  };

  static styles = css`
.container {
  position: absolute;
  right: 10px;
  bottom: 40px;
  z-index: 30;
  max-width: 692px;
  overflow: hidden;
  transition: transform 0.3s;
  display: flex;
  flex-flow: column wrap;
  justify-content: right;
  font-size: 14px;
  color: #030421;
  padding: 0 10px 10px 0;
  border-radius: 4px;
}

.legend-box {
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: row-reverse;
  align-items: center;
  height: 24px;
  border-radius: 4px;
}

.legend-badge {
  display: inline-block;
  width: 15px;
  height: 15px;
  margin: 0 5px;
  border-radius: 50%;
  box-shadow: 0 0 10px rgb(0 0 0 / 34%);
}

.legend {
  font-weight: bold;
  padding-left: 6px;
  display: none;
}

.legend-box:not(:hover) {
  background: transparent !important;
}

.legend-box:hover {
  border: 1px solid rgb(48 56 165 / 60%);
}

.legend-box:hover > .legend {
  display: flex;
  align-items: center;
}

.legend-box:hover .legend-badge {
  box-shadow: none;
}`;

  show() {
    this.isVisible = true;
  }

  hide() {
    this.isVisible = false;
  }

  render() {
    if (!this.isVisible) {
      return html``;
    }

    const colors = COLORS.LIGHT;
    const { legend } = window.i18n[currentLang()];

    return html`
     <div class="container">
       ${this.#createLegendBoxElement(colors.WARN, legend.warn)}
       ${this.#createLegendBoxElement(colors.FRIENDLY, legend.friendly)}
       ${this.#createLegendBoxElement(colors.DEFAULT, legend.default)}
    </div>
    `;
  }

  #createLegendBoxElement(
    theme,
    text
  ) {
    const style = `background-color: ${theme.color}; color: ${theme.font.color};`;

    return html`
    <div class="legend-box" style=${style}>
      <div class="legend-badge" style=${style}></div>
      <div class="legend">${text}</div>
    </div>
    `;
  }
}

customElements.define("nsecure-legend", Legend);
