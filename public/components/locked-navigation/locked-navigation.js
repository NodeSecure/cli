// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";

// Import Internal Dependencies
import { EVENTS } from "../../core/events";

export class LockedNavigation extends LitElement {
  static styles = css`
  :host {
  position: absolute;
  right: 132px;
  bottom: 10px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn{
  width: 0;
  height: 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 5px;
}

.next{
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-left: 16px solid #af2222;
}

.prev{
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-right: 16px solid #af2222;
}

.next:hover{
  border-left-color: #cb3d3d;
}

.prev:hover{
  border-right-color: #cb3d3d;
}
`;

  static properties = {
    isLocked: { type: Boolean },
    nextLabel: { type: String },
    prevLabel: { type: String }
  };

  constructor() {
    super();
    this.isLocked = false;

    this.lock = () => {
      this.isLocked = true;
    };

    this.unlock = () => {
      this.isLocked = false;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.LOCKED, this.lock);
    window.addEventListener(EVENTS.UNLOCKED, this.unlock);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.LOCKED, this.lock);
    window.removeEventListener(EVENTS.UNLOCKED, this.unlock);
    super.disconnectedCallback();
  }

  render() {
    if (!this.isLocked) {
      return nothing;
    }

    return html`
      <button type="button" @click=${this.moveToPreviousLockedNode}
        class="btn prev" ariaLabel=${this.prevLabel} ></button>
      <button type="button" @click=${this.moveToNextLockedNode}
        class=" btn next" ariaLabel=${this.nextLabel}></button>
  `;
  }

  moveToNextLockedNode() {
    window.dispatchEvent(new CustomEvent(EVENTS.MOVED_TO_NEXT_LOCKED_NODE, { composed: true }));
  }
  moveToPreviousLockedNode() {
    window.dispatchEvent(new CustomEvent(EVENTS.MOVED_TO_PREVIOUS_LOCKED_NODE, { composed: true }));
  }
}

customElements.define("locked-navigation", LockedNavigation);
