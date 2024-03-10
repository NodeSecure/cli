/* eslint-disable arrow-body-style */

// Import Third-party Dependencies
import { getManifest } from "@nodesecure/flags/web";

// Import Internal Dependencies
import * as utils from "./src/utils.js";
import * as CONSTANTS from "./src/constants.js";
import { Header } from "./src/components/header.js";
import { Navigation } from "./src/components/navigation.class.js";
import { fetchAndRenderByMenu } from "./src/fetch.js";

// CONSTANTS
const kSASTWarnings = [
  "parsing-error",
  "unsafe-import",
  "unsafe-regex",
  "unsafe-stmt",
  "shady-link",
  "encoded-literal",
  "short-identifiers",
  "suspicious-literal",
  "suspicious-file",
  "obfuscated-code",
  "weak-crypto"
].map((name) => ({ name }));

const kWikiMenus = {
  flags: {
    name: "Flags",
    data: Object.entries(getManifest()).map(([name, { title, emoji }]) => ({ name, title, icon: emoji })),
    callback(name, menuElement) {
      fetchAndRenderByMenu(menuElement, "flags").catch(console.error);
    }
  },
  warnings: {
    name: "SAST Warnings",
    data: kSASTWarnings,
    callback(name, menuElement) {
      fetchAndRenderByMenu(menuElement, "warnings").catch(console.error);
    }
  }
};

const kHeaderMenus = Object.entries(kWikiMenus)
  .map(([title, { name }]) => ({ name, title }));

/**
 * @description Render the documentation module in a given container
 * @param {!HTMLElement} rootElement
 * @param {object} [options]
 * @param {boolean} [options.prefetch=false]
 */
export function render(rootElement, options = {}) {
  const { prefetch = false } = options;

  const navigation = {};
  const containers = [];
  for (const [name, properties] of Object.entries(kWikiMenus)) {
    const nav = new Navigation({
      prefetch,
      fetchCallback: properties.callback
    });
    navigation[name] = nav;

    const container = utils.createDOMElement("div", {
      classList: [`documentation--${name}`, "documentation--sub-container"],
      childs: [
        utils.createDOMElement("div", {
          className: CONSTANTS.DIV_NAVIGATION,
          childs: [nav.generateFromIterable(properties.data)]
        }),
        utils.createDOMElement("div", { className: CONSTANTS.DIV_CONTENT })
      ]
    });
    if (containers.length > 0) {
      container.style.display = "none";
    }

    containers.push(container);
  }

  const header = new Header(kHeaderMenus, { defaultName: "flags" });
  const mainContainer = utils.createDOMElement("div", {
    className: "documentation--main",
    childs: [header.dom, ...containers]
  });

  for (const node of rootElement.childNodes) {
    node.remove();
  }
  rootElement.appendChild(mainContainer);

  document.addEventListener("keydown", (event) => {
    if (window.disableShortcuts) {
      return;
    }

    const isWikiOpen = document.getElementById("documentation-root-element").classList.contains("slide-in");
    // should not be possible but just in case
    const isSearchOpen = window.searchbar.background.classList.contains("show");
    if (!isWikiOpen || isSearchOpen) {
      return;
    }

    const activeNav = navigation[header.active.getAttribute("data-menu")];

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
        header.switchActiveView();
        break;
      case "ArrowUp":
        activeNav.previous();
        break;
      case "ArrowDown":
        activeNav.next();
        break;
      default:
        break;
    }
  });

  return {
    header,
    navigation
  };
}
