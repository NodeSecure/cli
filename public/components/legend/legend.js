// Import Internal Dependencies
import { COLORS } from "../../../workspaces/vis-network/src/constants.js";
import { createDOMElement, currentLang } from "../../common/utils.js";

export class Legend {
  constructor(
    options = {}
  ) {
    const { show = false } = options;

    const colors = COLORS.LIGHT;
    const { legend } = window.i18n[currentLang()];

    const fragment = document.createDocumentFragment();
    fragment.append(
      createLegendBoxElement(colors.WARN, legend.warn),
      createLegendBoxElement(colors.FRIENDLY, legend.friendly),
      createLegendBoxElement(colors.DEFAULT, legend.default)
    );

    this.DOMElement = document.getElementById("legend");
    this.DOMElement.replaceChildren(fragment);
    show && this.show();
  }

  show() {
    this.DOMElement.style.display = "flex";
  }

  hide() {
    this.DOMElement.style.display = "none";
  }
}

function createLegendBoxElement(
  theme,
  text
) {
  const styles = {
    backgroundColor: theme.color,
    color: theme.font.color
  };

  return createDOMElement("div", {
    className: "legend-box",
    childs: [
      createDOMElement("div", {
        className: "legend-badge",
        styles
      }),
      createDOMElement("div", {
        className: "legend",
        text
      })
    ],
    styles
  });
}
