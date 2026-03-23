// Import Internal Dependencies
import { createDOMElement } from "../common/utils.js";
import "../components/package-navigation/package-navigation.js";

// CONSTANTS
const kSearchShortcut = navigator.userAgent.includes("Mac") ? "⌘K" : "Ctrl+K";

export function initSearchNav(
  data,
  options = {}
) {
  const {
    initFromZero = true
  } = options;

  const searchNavElement = document.getElementById("search-nav");
  if (!searchNavElement) {
    throw new Error("Unable to found search navigation");
  }

  if (initFromZero) {
    searchNavElement.innerHTML = "";
    const element = document.createElement("package-navigation");
    searchNavElement.appendChild(
      element
    );
    element.metadata = data;
    element.activePackage = data.length > 0 ? data[0].spec : "";
  }

  if (document.getElementById("search-shortcut-hint") === null) {
    document.body.appendChild(
      createDOMElement("div", {
        classList: ["search-shortcut-hint"],
        attributes: { id: "search-shortcut-hint" },
        childs: [
          createDOMElement("kbd", { text: kSearchShortcut })
        ]
      })
    );
  }
}
