// Import Internal Dependencies
import { Bundlephobia } from "./bundlephobia.js";
import { PackageHeader } from "./header.js";
import * as Pannels from "./pannels/index.js";

export class PackageInfo {
  static DOMElementName = "package-info";

  static close() {
    const domElement = document.getElementById(PackageInfo.DOMElementName);
    if (domElement.classList.contains("slide-in")) {
      domElement.setAttribute("class", "slide-out");
    }
  }

  /**
   * @param {*} dependencyVersionData
   * @param {*} dependency
   * @param {*} nsn
   */
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

    new Bundlephobia(this.dependencyVersion.name, this.dependencyVersion.version)
      .fetchDataOnHttpServer()
      .catch(console.error);
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
    new Pannels.Licenses(this).generate(clone)
    new Pannels.Warnings(this).generate(clone)
    new Pannels.Scripts(this).generate(clone)
    new Pannels.Vulnerabilities(this).generate(clone)
    new Pannels.Scorecard(this).generate(clone);
    new Pannels.Files(this).generate(clone);

    return clone;
  }
}
