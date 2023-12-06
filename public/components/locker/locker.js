
export class Locker {
  constructor(nsn) {
    this.dom = document.getElementById("network-locker");
    this.networkView = document.getElementById("network--view");
    this.nsn = nsn;
    this.locked = false;
    this.unlockAuthorized = true;
    this.renderUnlock();

    document.addEventListener("keydown", (event) => {
      const hotkeys = JSON.parse(localStorage.getItem("hotkeys"));
      switch (event.key.toUpperCase()) {
        case hotkeys.lock: {
          this.auto();
          break;
        }
      }
    });
    this.dom.addEventListener("click", () => this.auto());
    this.nsn.network.on("highlight_done", this.highlightDone.bind(this));
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

  auto() {
    // Refuse locking if there is no multi selections
    if (this.nsn.lastHighlightedIds === null) {
      return;
    }

    this[this.locked ? "unlock" : "lock"]();
  }

  lock() {
    if (!this.locked) {
      console.log("[LOCKER] lock triggered");
      this.renderLock();
      this.locked = true;
    }
  }

  unlock() {
    if (!this.locked) {
      return;
    }

    console.log("[LOCKER] unlock triggered");
    this.renderUnlock();
    this.locked = false;

    // No node selected, so we reset highlight
    const selectedNode = window.networkNav.currentNodeParams;
    if (selectedNode === null) {
      this.nsn.resetHighlight();
    }
    else if (this.nsn.lastHighlightedIds !== null) {
      this.nsn.lastHighlightedIds = null;
      this.nsn.neighbourHighlight(selectedNode);
    }
  }

  renderLock() {
    this.dom.classList.add("enabled");
    this.dom.querySelector("p").textContent = "LOCKED";
    this.networkView.classList.add("locked");

    const iconElement = this.dom.querySelector("i");
    iconElement.classList.remove("icon-lock-open");
    iconElement.classList.add("icon-lock");
    iconElement.classList.add("enabled");
  }

  renderUnlock() {
    this.dom.classList.remove("enabled");
    this.dom.querySelector("p").textContent = "UNLOCKED";
    this.networkView.classList.remove("locked");

    const iconElement = this.dom.querySelector("i");
    iconElement.classList.remove("icon-lock");
    iconElement.classList.remove("enabled");
    iconElement.classList.add("icon-lock-open");
  }
}
