/* eslint-disable arrow-body-style */

// Import Third-party Dependencies
import { getManifest } from "@nodesecure/flags/web";
import { warnings } from "@nodesecure/js-x-ray/warnings";

// Import Internal Dependencies
import * as utils from "./src/utils.js";
import * as CONSTANTS from "./src/constants.js";
import { Header } from "./src/components/header.js";
import { Navigation } from "./src/components/navigation.class.js";
import { fetchAndRenderByMenu } from "./src/fetch.js";

// CONSTANTS
const kSASTWarnings = Object
  .keys(warnings)
  .map((name) => ({ name }));

const kWikiMenus = {
  flags: {
    name: "Flags",
    data: Object.entries(getManifest()).map(([name, { title, emoji }]) => ({ name, title, icon: emoji })),
    callback(_name, menuElement) {
      fetchAndRenderByMenu(menuElement, "flags").catch(console.error);
    }
  },
  warnings: {
    name: "SAST Warnings",
    data: kSASTWarnings,
    callback(_name, menuElement) {
      fetchAndRenderByMenu(menuElement, "warnings").catch(console.error);
    }
  }
};

const kHeaderMenus = Object.entries(kWikiMenus)
  .map(([title, { name }]) => ({ name, title }));

/**
 * @description Render the documentation module in a given container
 * @param {object} [options]
 * @param {boolean} [options.prefetch=false]
 */
export function render(options = {}) {
  const { prefetch = false } = options;

  /** @type {Record<string, Navigation>} */
  const navigation = {};
  /** @type {HTMLElement[]} */
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
  const container = utils.createDOMElement("div", {
    className: "documentation--main",
    childs: [header.dom, ...containers]
  });

  return {
    container,
    header,
    navigation
  };
}
