// Import Internal Dependencies
import "../bundlephobia/bundlephobia.js";
import { PackageHeader } from "./header/header.js";
import * as Pannels from "./pannels/index.js";
import * as utils from "../../common/utils.js";

export class PackageInfo {
  static DOMElementName = "package-info";

  static close() {
    const domElement = document.getElementById(PackageInfo.DOMElementName);
    if (domElement.classList.contains("slide-in")) {
      domElement.setAttribute("class", "slide-out");
    }

    window.dispatchEvent(new CustomEvent("package-info-closed", { detail: null }));
  }

  /**
   * @param {"previous"|"next"} direction
   */
  static switch(direction) {
    const packageHTMLElement = document.getElementById(PackageInfo.DOMElementName);
    const packageNavigation = packageHTMLElement.querySelector(".package-navigation");
    const activeElement = packageNavigation.querySelector(".active");

    const enabledChilren = [...packageNavigation.children].filter((child) => child.classList.contains("disabled") === false);
    const activeElementIndex = [...enabledChilren].indexOf(activeElement);

    const nextElement = direction === "next"
      ? enabledChilren[enabledChilren.length === activeElementIndex + 1 ? 1 : activeElementIndex + 1]
      : enabledChilren[activeElementIndex === 1 ? enabledChilren.length - 1 : activeElementIndex - 1];

    nextElement.click();
  }

  /**
   *
   * @param {"up"|"down"} direction
   */
  static scroll(direction) {
    const packageHTMLElement = document.getElementById(PackageInfo.DOMElementName);
    const scrollableContainer = [...packageHTMLElement.querySelectorAll(".package-container")]
      .find((child) => child.classList.contains("hidden") === false);

    if (scrollableContainer.scrollHeight <= scrollableContainer.clientHeight) {
      return;
    }

    scrollableContainer.scrollTop += direction === "up" ? -50 : 50;
  }

  /**
   * @param {*} dependencyVersionData
   * @param {*} dependency
   * @param {*} nsn
   */
  // eslint-disable-next-line max-params
  constructor(
    dependencyVersionData,
    currentNode,
    dependency,
    nsn
  ) {
    this.codeCache = new Map();
    this.menus = new Map();
    this.nsn = nsn;
    this.currentNode = currentNode;
    this.dependencyVersion = dependencyVersionData;
    this.dependency = dependency;

    this.initialize();
  }

  initialize() {
    const packageHTMLElement = document.getElementById(PackageInfo.DOMElementName);
    packageHTMLElement.innerHTML = "";
    packageHTMLElement.appendChild(
      this.render()
    );
    this.enableNavigation(
      window.settings.config.defaultPackageMenu
    );
    packageHTMLElement.setAttribute("class", "slide-in");

    if (window.settings.config.disableExternalRequests) {
      return;
    }

    const panFiles = packageHTMLElement.querySelector("#pan-files");

    const bundlephobia = utils.createDOMElement("bundle-phobia", {
      attributes: {
        name: this.dependencyVersion.name,
        version: this.dependencyVersion.version
      }
    });

    panFiles.appendChild(bundlephobia);
  }

  /**
   * @param {HTMLElement} navElement
   * @param {number} [count=0]
   */
  addNavigationSignal(navElement, count = 0) {
    if (count === 0) {
      navElement.classList.add("disabled");
    }
    else {
      const counter = navElement.querySelector(".signal");
      counter.style.display = "flex";
      counter.appendChild(document.createTextNode(count));
    }
  }

  /**
   * @param {!string} name
   * @returns {void}
   */
  enableNavigation(name) {
    const div = this.menus.has(name) ? this.menus.get(name) : this.menus.get("info");

    const isActive = div.classList.contains("active");
    const isDisabled = div.classList.contains("disabled");
    const dataTitle = div.getAttribute("data-title");

    if (isActive || isDisabled) {
      return;
    }

    div.classList.add("active");
    this.activeNavigation.classList.remove("active");

    const targetPan = document.getElementById(`pan-${name}`);
    const currentPan = document.getElementById(`pan-${this.activeNavigation.getAttribute("data-menu")}`);
    targetPan.classList.remove("hidden");
    currentPan.classList.add("hidden");
    document.querySelector(".container-title").textContent = dataTitle;

    this.activeNavigation = div;
  }

  render() {
    const template = document.getElementById("package-info-template");
    /** @type {HTMLTemplateElement} */
    const clone = document.importNode(template.content, true);

    this.activeNavigation = clone.querySelector(".package-navigation > div.active");
    for (const div of clone.querySelectorAll(".package-navigation > div")) {
      const dataMenu = div.getAttribute("data-menu");
      this.menus.set(dataMenu, div);

      div.addEventListener("click", () => this.enableNavigation(dataMenu));
    }

    this.links = new PackageHeader(this).generate(clone);

    new Pannels.Overview(this).generate(clone);
    new Pannels.Licenses(this).generate(clone);
    new Pannels.Warnings(this).generate(clone);
    new Pannels.Scripts(this).generate(clone);
    new Pannels.Vulnerabilities(this).generate(clone);
    if (window.settings.config.disableExternalRequests === false) {
      new Pannels.Scorecard(this).generate(clone);
    }
    new Pannels.Files(this).generate(clone);

    return clone;
  }
}
