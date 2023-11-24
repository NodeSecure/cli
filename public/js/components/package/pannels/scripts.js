// Import Internal Dependencies
import * as utils from "../../../utils.js";

export class Scripts {
  static SimulationTimeout = null;

  constructor(pkg) {
    this.package = pkg;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    this.setupSignal(clone);

    clone.querySelector(".package-scripts")
      .appendChild(this.renderScripts());
    this.renderDependencies(clone);
    this.showHideDependenciesInTree(clone);
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  setupSignal(clone) {
    const { flags } = this.package.dependencyVersion;

    if (flags.includes("hasScript")) {
      this.package.addNavigationSignal(
        clone.getElementById("dependencies-nav-menu"),
        "!"
      );
    }
  }

  renderScripts() {
    const fragment = document.createDocumentFragment();
    const createPElement = (className, text) => utils.createDOMElement("p", { className, text });

    const scripts = Object.entries(this.package.dependencyVersion.scripts);
    const hideItemsLength = 4;
    const hideItems = scripts.length > hideItemsLength;

    for (let id = 0; id < scripts.length; id++) {
      const [key, value] = scripts[id];

      const script = utils.createDOMElement("div", {
        className: "script",
        childs: [
          createPElement("name", key),
          createPElement("value", value)
        ]
      });
      if (hideItems && id >= hideItemsLength) {
        script.classList.add("hidden");
      }

      fragment.appendChild(script);
    }

    if (hideItems) {
      fragment.appendChild(utils.createExpandableSpan(hideItemsLength));
    }

    return fragment;
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  renderDependencies(clone) {
    const { composition } = this.package.dependencyVersion;

    utils.createItemsList(
      clone.getElementById("nodedep"),
      composition.required_nodejs,
      {
        hideItemsLength: 8,
        onclick: (_, coreModuleName) => this.openNodeDocumentation(coreModuleName)
      }
    );

    utils.createItemsList(
      clone.getElementById("unuseddep"),
      composition.unused
    );
    utils.createItemsList(
      clone.getElementById("missingdep"),
      composition.missing
    );

    utils.createItemsList(
      clone.getElementById("requireddep"),
      composition.required_thirdparty,
      {
        onclick: (_, packageName) => this.package.nsn.focusNodeByName(packageName),
        hideItems: true
      }
    );
  }

  openNodeDocumentation(coreModuleName) {
    const name = coreModuleName.startsWith('node:') ?
      coreModuleName.slice(5) : coreModuleName;

    window
      .open(`https://nodejs.org/dist/latest/docs/api/${name}.html`, "_blank")
      .focus();
  }

  showHideDependenciesInTree(clone) {
    const btnShow = clone.getElementById("show-hide-dependency");
    if (this.package.currentNode === 0) {
      btnShow.classList.add("disabled");

      return;
    }
    btnShow.innerHTML = this.package.dependencyVersion.hidden ?
      "<i class='icon-eye'></i> show" : "<i class='icon-eye-off'></i> hide";

    if (this.package.dependency.metadata.dependencyCount === 0) {
      btnShow.classList.add("disabled");
    }
    else {
      btnShow.addEventListener("click", () => {
        const currBtn = document.getElementById("show-hide-dependency");
        currBtn.classList.toggle("active");
        const hidden = !this.package.dependencyVersion.hidden;

        currBtn.innerHTML = hidden ? "<i class='icon-eye'></i> show" : "<i class='icon-eye-off'></i> hide";

        this.package.nsn.highlightNodeNeighbour(this.package.currentNode, hidden);
        if (Scripts.SimulationTimeout !== null) {
          clearTimeout(Scripts.SimulationTimeout);
        }
        Scripts.SimulationTimeout = setTimeout(() => {
          this.package.nsn.network.stopSimulation();
          Scripts.SimulationTimeout = null;
        }, 500);
        this.package.dependencyVersion.hidden = !this.package.dependencyVersion.hidden;
      });
    }
  }
}
