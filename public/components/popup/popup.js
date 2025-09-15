// Import Third-party Dependencies
import { html, LitElement, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

// Import Internal Dependencies
import { EVENTS } from "../../core/events";

class Popup extends LitElement {
  static styles = css`

:host{
  z-index: 50;
}

/** TODO: ANIMATE ? **/
section#popup--background {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;

  /* pointer-events: none; */
  background: radial-gradient(ellipse at center, rgb(255 255 255 / 0%) 0%, rgb(30 35 65) 100%);
}

.show {
  visibility: visible;
  opacity: 1 ;
  transition: opacity 0.35s ease-in, visibility 0ms ease-in 0ms ;
}

.hidden{
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.35s ease-in, visibility 0ms ease-in 0.35s;
}

section#popup--background>.popup {
  pointer-events: all !important;
  background: #f5f4f4;
  border-radius: 4px;
  box-shadow: 5px 5px 15px rgb(23 27 129 / 41%);
  border-left: 2px solid #fff;
  border-top: 2px solid #FFF;
}

 .dark >.popup {
  background: #303263 !important;
  box-shadow: 5px 5px 15px var(--dark-theme-primary-color) !important;
  border-left: 2px solid var(--dark-theme-secondary-darker) !important;
  border-top: 2px solid var(--dark-theme-secondary-darker) !important;
}
`;

  static properties = {
    isOpen: { type: Boolean },
    theme: { type: String }
  };
  constructor() {
    super();
    this.isOpen = false;

    this.open = ({ detail: { content } }) => {
      if (this.isOpen) {
        return;
      }
      this.appendChild(content);
      this.isOpen = true;
    };

    this.close = () => {
      if (!this.isOpen) {
        return;
      }
      this.replaceChildren();
      this.isOpen = false;
    };

    this.settingsChanged = ({ detail: { theme } }) => {
      if (theme !== this.theme) {
        this.theme = theme;
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.MODAL_OPENED, this.open);
    window.addEventListener(EVENTS.MODAL_CLOSED, this.close);
    window.addEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.MODAL_OPENED, this.open);
    window.removeEventListener(EVENTS.MODAL_CLOSED, this.close);
    window.removeEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
    super.disconnectedCallback();
  }

  render() {
    const classes = { hidden: !this.isOpen, show: this.isOpen, dark: this.theme === "dark" };

    return html`
      <section class=${classMap(classes)} @click=${this.close} id="popup--background">
        <div class="popup" part="popup-container" @click=${(e) => {
          e.stopPropagation();
        }}>
          <slot></slot>
        </div>
      </section>
`;
  }
}

customElements.define("nsecure-popup", Popup);
