/* eslint-disable arrow-body-style */

// Import Third-party Dependencies
import { getManifest } from "@nodesecure/flags/web";
import { warnings } from "@nodesecure/js-x-ray/warnings";

// Import Internal Dependencies
import * as utils from "./utils.ts";
import * as CONSTANTS from "./constants.ts";
import { Header } from "./components/header.ts";
import { Navigation } from "./components/navigation.class.ts";
import { fetchAndRenderByMenu } from "./fetch.ts";

// CONSTANTS
const kSASTWarnings = Object
  .keys(warnings)
  .map((name) => ({ name }));

const kWikiMenus = {
  flags: {
    name: "Flags",
    data: Object
      .entries(getManifest())
      .map(([name, { title, emoji }]) => ({ name, title, icon: emoji })),
    callback(_name: string, menuElement: HTMLElement) {
      fetchAndRenderByMenu(menuElement, "flags").catch(console.error);
    }
  },
  warnings: {
    name: "SAST Warnings",
    data: kSASTWarnings,
    callback(_name: string, menuElement: HTMLElement) {
      fetchAndRenderByMenu(menuElement, "warnings").catch(console.error);
    }
  }
};

const kHeaderMenus = Object.entries(kWikiMenus)
  .map(([title, { name }]) => ({ name, title }));

export interface RenderDocumentationUIOptions {
  /**
   * Prefetch all flags and cache them
   *
   * @default false
   */
  prefetch?: boolean;
}

export interface RenderResult {
  container: HTMLElement;
  header: Header;
  navigation: Record<string, Navigation>;
}

export function render(
  element: HTMLElement,
  options: RenderDocumentationUIOptions = {}
): RenderResult {
  const { prefetch = false } = options;

  const navigation: Record<string, Navigation> = {};
  const containers: HTMLElement[] = [];
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

  element.append(container);

  return {
    container,
    header,
    navigation
  };
}
