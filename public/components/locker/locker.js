
export class Locker {
  constructor(nsn) {
    this.dom = document.getElementById("network-locker");
    this.networkView = document.getElementById("network--view");
    this.nsn = nsn;
    this.unlock();

    document.addEventListener("keydown", (event) => {
      const hotkeys = JSON.parse(localStorage.getItem("hotkeys"));
      switch (event.key.toUpperCase()) {
        case hotkeys.lock: {
          this.auto();
          break;
        }
      }
    });
    this.dom.addEventListener("click", () => {
      this.auto();
    });

    this.nsn.network.on("highlight_done", () => {
      this.unlock();
    });
  }

  auto() {
    const wasLocked = this.locked === true;
    this[this.locked ? "unlock" : "lock"]();

    if (wasLocked) {
      if (window.networkNav.currentNodeParams === null) {
        this.nsn.resetHighlight();
      }
      else {
        this.nsn.neighbourHighlight(window.networkNav.currentNodeParams);
      }
    }
  }

  lock(force = false) {
    if (window.networkNav.currentNodeParams !== null && !force) {
      return;
    }
    this.dom.classList.add("enabled");
    this.dom.querySelector("p").textContent = "LOCKED";
    this.networkView.classList.add("locked");

    const iconElement = this.dom.querySelector("i");
    iconElement.classList.remove("icon-lock-open");
    iconElement.classList.add("icon-lock");
    iconElement.classList.add("enabled");

    this.nsn.lock();
    this.locked = true;
  }

  unlock() {
    this.dom.classList.remove("enabled");
    this.dom.querySelector("p").textContent = "UNLOCKED";
    this.networkView.classList.remove("locked");

    const iconElement = this.dom.querySelector("i");
    iconElement.classList.remove("icon-lock");
    iconElement.classList.remove("enabled");
    iconElement.classList.add("icon-lock-open");

    this.nsn.unlock();
    this.locked = false;
  }
}
