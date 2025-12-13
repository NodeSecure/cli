// Import Internal Dependencies
import "../bundlephobia/bundlephobia.js";
import { PackageHeader } from "./header/header.js";
import * as Pannels from "./pannels/index.js";
import { EVENTS } from "../../core/events.js";

export class PackageInfo {
  static DOMElementName = "package-info";
  /**
   * Used to force a specific menu to open when focusing a package in the network
   */
  static ForcedPackageMenu = null;

  static close() {
    const domElement = document.getElementById(PackageInfo.DOMElementName);
    if (domElement.classList.contains("slide-in")) {
      domElement.setAttribute("class", "slide-out");
    }

    window.dispatchEvent(new CustomEvent(EVENTS.PACKAGE_INFO_CLOSED, { detail: null }));
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

    const panFiles = packageHTMLElement.querySelector("#pan-files");
    const files = document.createElement("package-files");
    files.package = this;
    files.id = "pan-files";
    files.classList.add("package-container", "hidden");
    panFiles.parentElement.replaceChild(files, panFiles);

    const panLicenses = packageHTMLElement.querySelector("#pan-licenses");
    const licenses = document.createElement("package-licenses");
    licenses.package = this;
    licenses.id = "pan-licenses";
    licenses.classList.add("package-container", "hidden");
    panLicenses.parentElement.replaceChild(licenses, panLicenses);

    const panVulns = packageHTMLElement.querySelector("#pan-vulnerabilities");
    const vulns = document.createElement("package-vulnerabilities");
    vulns.package = this;
    vulns.vulnerabilityStrategy = window.vulnerabilityStrategy;
    vulns.theme = window.settings.config.theme;
    vulns.id = "pan-vulnerabilities";
    vulns.classList.add("package-container", "hidden");
    panVulns.parentElement.replaceChild(vulns, panVulns);

    const panDependencies = packageHTMLElement.querySelector("#pan-dependencies");
    const scripts = document.createElement("package-scripts");
    scripts.package = this;
    scripts.isHidden = this.dependencyVersion.hidden;
    scripts.id = "pan-dependencies";
    scripts.classList.add("package-container", "hidden");
    panDependencies.parentElement.replaceChild(scripts, panDependencies);

    const menuToOpen = PackageInfo.ForcedPackageMenu ??
      window.settings.config.defaultPackageMenu;
    this.enableNavigation(menuToOpen);
    PackageInfo.ForcedPackageMenu = null;
    packageHTMLElement.setAttribute("class", "slide-in");
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
   * @param {!HTMLTemplateElement} clone
   */
  setupSignal(clone) {
    const { flags } = this.dependencyVersion;

    if (flags.includes("hasScript")) {
      this.addNavigationSignal(
        clone.getElementById("dependencies-nav-menu"),
        "!"
      );
    }
  }

  /**
   * @param {!string} name
   * @returns {void}
   */
  enableNavigation(name) {
    const div = this.menus.has(name) ?
      this.menus.get(name) :
      this.menus.get("info");

    const isActive = div.classList.contains("active");
    const isDisabled = div.classList.contains("disabled");
    const dataTitle = div.getAttribute("data-title");

    if (isActive || isDisabled) {
      return;
    }

    div.classList.add("active");
    this.activeNavigation.classList.remove("active");

    const currentPan = document.getElementById(`pan-${this.activeNavigation.getAttribute("data-menu")}`);
    currentPan.classList.add("hidden");
    const targetPan = document.getElementById(`pan-${name}`);
    targetPan.classList.remove("hidden");
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
    new Pannels.Warnings(this).generate(clone);
    this.setupSignal(clone);
    this.addNavigationSignal(clone.getElementById("vulnerabilities-nav-menu"),
      this.dependency.vulnerabilities.length);
    if (window.settings.config.disableExternalRequests === false) {
      new Pannels.Scorecard(this).generate(clone);
    }

    return clone;
  }
}
