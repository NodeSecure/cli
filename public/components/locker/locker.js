// Import Third-party Dependencies
import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

// Import Internal Dependencies
import * as utils from "../../common/utils.js";
import { EVENTS } from "../../core/events.js";
import "../icon/icon.js";

export class Locker extends LitElement {
  static styles = css`
#network-locker {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 30;
  display: flex;
  height: 30px;
  border-radius: 4px;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--primary);
  transition: 0.3s all linear;
  cursor: pointer;
}

#network-locker:not(.enabled) {
  background-color: var(--primary);
}

#network-locker.enabled {
  background-color: #af2222;
}

#network-locker>div {
  height: inherit;
  padding: 0 5px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  margin-right: 10px;
  transition: 0.3s all linear;
}

#network-locker>div>nsecure-icon {
  margin: 0;
  transform: translateX(3px);
}


#network-locker>div:not(.enabled) {
  background-color: var(--primary-lighter);
}

#network-locker>div.enabled {
  background-color: #cb3d3d;
}

#network-locker>p {
  font-family: mononoki;
  padding-right: 10px;
  display: flex;
  align-items: center;
  height: inherit;
  text-transform: capitalize;
}
`;

  static get properties() {
    return {
      locked: { type: Boolean },
      unlockAuthorized: { type: Boolean },
      nsn: { type: Object },
      isNetworkViewHidden: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.locked = false;
    this.unlockAuthorized = true;
    this.isNetworkViewHidden = false;
    this.hideNetworkView = () => {
      if (this.isNetworkViewHidden) {
        return;
      }
      this.isNetworkViewHidden = true;
    };

    this.showNetworkView = () => {
      if (!this.isNetworkViewHidden) {
        return;
      }
      this.isNetworkViewHidden = false;
    };

    this.onKeyDown = (event) => {
      const isTargetInput = event.target.tagName === "INPUT";
      const isTargetPopup = event.target.id === "popup--background";
      if (this.isNetworkViewHidden || isTargetInput || isTargetPopup) {
        return;
      }

      const hotkeys = JSON.parse(localStorage.getItem("hotkeys"));
      switch (event.key.toUpperCase()) {
        case hotkeys.lock: {
          this.auto();
          break;
        }
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.NETWORK_VIEW_HID, this.hideNetworkView);
    window.addEventListener(EVENTS.NETWORK_VIEW_SHOWED, this.showNetworkView);
    document.addEventListener("keydown", this.onKeyDown);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.NETWORK_VIEW_HID, this.hideNetworkView);
    window.removeEventListener(EVENTS.NETWORK_VIEW_SHOWED, this.showNetworkView);
    document.removeEventListener("keydown", this.onKeyDown);
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has("nsn")) {
      const oldNsn = changedProperties.get("nsn");

      if (oldNsn) {
        oldNsn.network.off("highlight_done", this.highlightDone);
      }

      if (this.nsn) {
        this.nsn.network.on("highlight_done", this.highlightDone);
      }
    }
  }

  render() {
    const networkLockerClasses = classMap({
      enabled: this.locked
    });
    const iconClasses = classMap({
      enabled: this.locked
    });

    return html`<div @click=${this.auto} class=${networkLockerClasses} id="network-locker">
        <div class=${iconClasses}>
        <nsecure-icon  name=${this.locked ? "lock" : "unlock"}></nsecure-icon>
        </div>
        <p>${this.locked ? window.i18n[utils.currentLang()].network.locked
          : window.i18n[utils.currentLang()].network.unlocked}</p>
      </div>`;
  }

  auto() {
    // Refuse locking if there is no multi selections
    if (this.nsn.lastHighlightedIds === null) {
      return;
    }

    this[this.locked ? "unlock" : "lock"]();
  }

  highlightDone() {
    if (!this.unlockAuthorized) {
      return;
    }

    console.log("[LOCKER] highlight done emitted");
    this.unlockAuthorized = false;
    setTimeout(() => {
      this.unlockAuthorized = true;
    }, 1);

    this.unlock();
  }

  lock() {
    if (!this.locked) {
      console.log("[LOCKER] lock triggered");
      this.locked = true;
      window.dispatchEvent(new CustomEvent(EVENTS.LOCKED, { composed: true }));
    }
  }

  unlock() {
    if (!this.locked) {
      return;
    }

    console.log("[LOCKER] unlock triggered");
    this.locked = false;
    window.dispatchEvent(new CustomEvent(EVENTS.UNLOCKED, { composed: true }));

    // No node selected, so we reset highlight
    const selectedNode = window.networkNav.currentNodeParams;
    if (selectedNode === null) {
      this.nsn.resetHighlight();
    }
    else if (this.nsn.lastHighlightedIds !== null) {
      this.nsn.lastHighlightedIds = null;
      this.nsn.neighbourHighlight(selectedNode, window.i18n[utils.currentLang()]);
    }
  }
}

customElements.define("nsecure-locker", Locker);
