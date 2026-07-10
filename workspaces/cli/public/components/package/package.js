// Import Internal Dependencies
import "../bundlephobia/bundlephobia.js";
import { PackageHeader } from "./header/header.js";
import * as Pannels from "./pannels/index.js";
import { EVENTS } from "../../core/events.js";
import * as utils from "../../common/utils.js";

export class PackageInfo {
  static DOMElementName = "package-info";
  /**
   * Used to force a specific menu to open when focusing a package in the network
   *
   * @type {string | null}
   */
  static ForcedPackageMenu = null;

  static close() {
    const domElement = /** @type {HTMLElement} */ (document.getElementById(PackageInfo.DOMElementName));
    if (domElement.classList.contains("slide-in")) {
      domElement.setAttribute("class", "slide-out");
    }

    window.dispatchEvent(new CustomEvent(EVENTS.PACKAGE_INFO_CLOSED, { detail: null }));
  }

  /**
   * @param {"previous"|"next"} direction
   */
  static switch(direction) {
    const packageHTMLElement = /** @type {HTMLElement} */ (document.getElementById(PackageInfo.DOMElementName));
    const packageNavigation = /** @type {HTMLElement} */ (packageHTMLElement.querySelector(".package-navigation"));
    const activeElement = packageNavigation.querySelector(".active");

    const enabledChilren = [...packageNavigation.children].filter((child) => child.classList.contains("disabled") === false);
    const activeElementIndex = [...enabledChilren].indexOf(/** @type {Element} */ (activeElement));

    const nextElement = /** @type {HTMLElement} */ (direction === "next"
      ? enabledChilren[enabledChilren.length === activeElementIndex + 1 ? 1 : activeElementIndex + 1]
      : enabledChilren[activeElementIndex === 1 ? enabledChilren.length - 1 : activeElementIndex - 1]);

    nextElement.click();
  }

  /**
   *
   * @param {"up"|"down"} direction
   */
  static scroll(direction) {
    const packageHTMLElement = /** @type {HTMLElement} */ (document.getElementById(PackageInfo.DOMElementName));
    const scrollableContainer = /** @type {HTMLElement} */ ([...packageHTMLElement.querySelectorAll(".package-container")]
      .find((child) => child.classList.contains("hidden") === false));

    if (scrollableContainer.scrollHeight <= scrollableContainer.clientHeight) {
      return;
    }

    scrollableContainer.scrollTop += direction === "up" ? -50 : 50;
  }

  /**
   * @param {*} dependencyVersionData
   * @param {number} currentNode
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
    /** @type {Map<string, any>} */
    this.codeCache = new Map();
    /** @type {Map<string, HTMLElement>} */
    this.menus = new Map();
    this.nsn = nsn;
    this.currentNode = currentNode;
    this.dependencyVersion = dependencyVersionData;
    this.dependency = dependency;
    /** @type {HTMLElement} */
    this.activeNavigation = /** @type {any} */ (undefined);
    /** @type {Record<string, import("./header/header.js").HeaderLink>} */
    this.links = /** @type {any} */ (undefined);

    this.initialize();
  }

  initialize() {
    const packageHTMLElement = /** @type {HTMLElement} */ (document.getElementById(PackageInfo.DOMElementName));
    packageHTMLElement.innerHTML = "";
    packageHTMLElement.appendChild(
      this.render()
    );

    const panFiles = /** @type {HTMLElement} */ (packageHTMLElement.querySelector("#pan-files"));
    const files = document.createElement("package-files");
    files.package = this;
    files.id = "pan-files";
    files.classList.add("package-container", "hidden");
    /** @type {HTMLElement} */ (panFiles.parentElement).replaceChild(files, panFiles);

    const panLicenses = /** @type {HTMLElement} */ (packageHTMLElement.querySelector("#pan-licenses"));
    const licenses = document.createElement("package-licenses");
    licenses.package = this;
    licenses.id = "pan-licenses";
    licenses.classList.add("package-container", "hidden");
    /** @type {HTMLElement} */ (panLicenses.parentElement).replaceChild(licenses, panLicenses);

    const panVulns = /** @type {HTMLElement} */ (packageHTMLElement.querySelector("#pan-vulnerabilities"));
    const vulns = document.createElement("package-vulnerabilities");
    vulns.package = this;
    vulns.vulnerabilityStrategy = window.vulnerabilityStrategy;
    vulns.theme = utils.getSettingsConfig().theme;
    vulns.id = "pan-vulnerabilities";
    vulns.classList.add("package-container", "hidden");
    /** @type {HTMLElement} */ (panVulns.parentElement).replaceChild(vulns, panVulns);

    const panDependencies = /** @type {HTMLElement} */ (packageHTMLElement.querySelector("#pan-dependencies"));
    const scripts = document.createElement("package-scripts");
    scripts.package = this;
    scripts.isHidden = this.dependencyVersion.hidden;
    scripts.id = "pan-dependencies";
    scripts.classList.add("package-container", "hidden");
    /** @type {HTMLElement} */ (panDependencies.parentElement).replaceChild(scripts, panDependencies);

    const menuToOpen = PackageInfo.ForcedPackageMenu ??
      utils.getSettingsConfig().defaultPackageMenu;
    this.enableNavigation(menuToOpen);
    PackageInfo.ForcedPackageMenu = null;
    packageHTMLElement.setAttribute("class", "slide-in");
  }

  /**
   * @param {HTMLElement} navElement
   * @param {number | string} [count=0]
   */
  addNavigationSignal(navElement, count = 0) {
    if (count === 0) {
      navElement.classList.add("disabled");
    }
    else {
      const counter = /** @type {HTMLElement} */ (navElement.querySelector(".signal"));
      counter.style.display = "flex";
      counter.appendChild(document.createTextNode(String(count)));
    }
  }

  /**
   * @param {!DocumentFragment} clone
   */
  setupSignal(clone) {
    const { flags } = this.dependencyVersion;

    if (flags.includes("hasScript")) {
      this.addNavigationSignal(
        /** @type {HTMLElement} */ (clone.getElementById("dependencies-nav-menu")),
        "!"
      );
    }
  }

  /**
   * @param {!string} name
   * @returns {void}
   */
  enableNavigation(name) {
    const div = /** @type {HTMLElement} */ (this.menus.has(name) ?
      this.menus.get(name) :
      this.menus.get("info"));

    const isActive = div.classList.contains("active");
    const isDisabled = div.classList.contains("disabled");
    const dataTitle = div.getAttribute("data-title");

    if (isActive || isDisabled) {
      return;
    }

    div.classList.add("active");
    this.activeNavigation.classList.remove("active");

    const currentPan = /** @type {HTMLElement} */ (
      document.getElementById(`pan-${this.activeNavigation.getAttribute("data-menu")}`)
    );
    currentPan.classList.add("hidden");
    const targetPan = /** @type {HTMLElement} */ (document.getElementById(`pan-${name}`));
    targetPan.classList.remove("hidden");
    /** @type {HTMLElement} */ (document.querySelector(".container-title")).textContent = dataTitle;

    this.activeNavigation = div;
  }

  render() {
    const template = /** @type {HTMLTemplateElement} */ (document.getElementById("package-info-template"));
    const clone = document.importNode(template.content, true);

    this.activeNavigation = /** @type {HTMLElement} */ (clone.querySelector(".package-navigation > div.active"));
    for (const div of clone.querySelectorAll(".package-navigation > div")) {
      const dataMenu = /** @type {string} */ (div.getAttribute("data-menu"));
      this.menus.set(dataMenu, /** @type {HTMLElement} */ (div));

      div.addEventListener("click", () => this.enableNavigation(dataMenu));
    }

    this.links = new PackageHeader(this).generate(clone);

    new Pannels.Overview(this).generate(clone);
    new Pannels.Warnings(this).generate(clone);
    this.setupSignal(clone);
    this.addNavigationSignal(/** @type {HTMLElement} */ (clone.getElementById("vulnerabilities-nav-menu")),
      this.dependency.vulnerabilities.length);
    if (utils.getSettingsConfig().disableExternalRequests === false) {
      new Pannels.Scorecard(this).generate(clone);
    }

    return clone;
  }
}
