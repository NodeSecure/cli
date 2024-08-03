// Import Internal Dependencies
import { COLORS } from "../../../workspaces/vis-network/src/constants.js";
import { currentLang } from "../../common/utils.js";

export class Legend {
  constructor(options = {}) {
    const { show = false } = options;
    const lang = currentLang();
    const theme = "LIGHT";
    const legend = document.getElementById("legend");
    const colors = COLORS[theme];

    const defaultBadgeElement = document.createElement("div");
    defaultBadgeElement.classList.add("legend-badge");
    defaultBadgeElement.style.backgroundColor = colors.DEFAULT.color;
    defaultBadgeElement.style.color = colors.DEFAULT.font.color;
    const defaultElement = document.createElement("div");
    defaultElement.classList.add("legend");
    defaultElement.textContent = window.i18n[lang].legend.default;

    const warnBadgeElement = document.createElement("div");
    warnBadgeElement.classList.add("legend-badge");
    warnBadgeElement.style.backgroundColor = colors.WARN.color;
    warnBadgeElement.style.color = colors.WARN.font.color;
    const warnElement = document.createElement("div");
    warnElement.classList.add("legend");
    warnElement.textContent = window.i18n[lang].legend.warn;

    const friendlyBadgeElement = document.createElement("div");
    friendlyBadgeElement.classList.add("legend-badge");
    friendlyBadgeElement.style.backgroundColor = colors.FRIENDLY.color;
    friendlyBadgeElement.style.color = colors.FRIENDLY.font.color;
    const friendlyElement = document.createElement("div");
    friendlyElement.classList.add("legend");
    friendlyElement.textContent = window.i18n[lang].legend.friendly;

    const warnBox = document.createElement("div");
    warnBox.classList.add("legend-box");
    warnBox.appendChild(warnBadgeElement);
    warnBox.appendChild(warnElement);
    warnBox.style.backgroundColor = colors.WARN.color;
    warnBox.style.color = colors.WARN.font.color;

    const friendlyBox = document.createElement("div");
    friendlyBox.classList.add("legend-box");
    friendlyBox.appendChild(friendlyBadgeElement);
    friendlyBox.appendChild(friendlyElement);
    friendlyBox.style.backgroundColor = colors.FRIENDLY.color;
    friendlyBox.style.color = colors.FRIENDLY.font.color;

    const defaultBox = document.createElement("div");
    defaultBox.classList.add("legend-box");
    defaultBox.appendChild(defaultBadgeElement);
    defaultBox.appendChild(defaultElement);
    defaultBox.style.backgroundColor = colors.DEFAULT.color;
    defaultBox.style.color = colors.DEFAULT.font.color;

    legend.appendChild(warnBox);
    legend.appendChild(friendlyBox);
    legend.appendChild(defaultBox);

    if (show) {
      this.show();
    }
  }

  show() {
    document.getElementById("legend").style.display = "flex";
  }

  hide() {
    document.getElementById("legend").style.display = "none";
  }
}
