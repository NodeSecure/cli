// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import "../../../expandable/expandable.js";
import "../../../items-list/items-list.js";
import "../../../icon/icon.js";
import { scrollbarStyle } from "../../../../common/scrollbar-style.js";

// CONSTANTS
const kUnsafeNpmScripts = new Set([
  "install",
  "preinstall",
  "postinstall",
  "preuninstall",
  "postuninstall"
]);

class Scripts extends LitElement {
  static styles = [
    scrollbarStyle,
    css`
:host {
  display: block;
  overflow: hidden auto;
  height: calc(100vh - 315px);
  box-sizing: border-box;
}

.package-scripts {
  display: flex;
  flex-direction: column;
  margin: 10px 0;
}

.package-scripts .script {
  display: flex;
  flex-direction: column;
  padding: 5px;
  border-radius: 4px;
  box-sizing: border-box;
}

.package-scripts .script.suspicious {
  background: #8776464f;
}

.package-scripts .script:nth-child(even) {
  background: rgb(150 100 150 / 5%);
}

.package-scripts .script+.script {
  margin-top: 5px;
}

.package-scripts .script.suspicious p.name {
  color: #efe493;
}

.package-scripts .script > p {
  margin: 0;
}

.package-scripts .script p.name {
  color: #B3E5FC;
  height: 26px;
  display: flex;
  align-items: center;
  letter-spacing: 0.3px;
}

.package-scripts .script p.value {
  font-size: 13px;
  color: #f3e4f8;
  font-family: mononoki;
  margin-top: 5px;
}

.head-title {
  background: var(--primary-darker);
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--primary-lighter);
  border-radius: 2px 2px 0 0;
}

.head-title.no-margin {
  margin-top: 0;
}

.head-title>p {
  text-shadow: 1px 1px 5px rgb(20 20 20 / 50%);
  font-size: 18px;
  font-variant: small-caps;

  /* lowercase is needed with small-caps font variant */
  text-transform: lowercase;
  font-family: mononoki;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 0 10px;
}

.head-title>span {
  margin-left: auto;
  background: #0068ff;
  margin-right: 10px;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: mononoki;
  text-shadow: 2px 2px 5px #000000d4;
  transition: all 0.5s ease;
  cursor: pointer;
}

.head-title>span.disabled {
  background: #3b3b3b;
  cursor: default;
  opacity: 0.3;
}

.head-title>span.active {
  background: #7900ff;
}

.head-title>span.active:not(.disabled):hover {
  background: #0068ff;
}

.head-title>span:not(.disabled, .active):hover {
  background: #7900ff;
}

#show-hide-dependency nsecure-icon {
  transform: translateY(2px);
}
`];

  static properties = {
    package: { type: Object },
    isClosed: { type: Boolean },
    isHidden: { type: Boolean }
  };

  static SimulationTimeout = null;

  constructor() {
    super();
    this.isClosed = true;
  }

  render() {
    return html`
      ${this.#renderScripts()}
      ${this.#renderDependencies()}
    `;
  }

  #renderScripts() {
    const hideItemsLength = 4;
    const scripts = Object.entries(this.package.dependencyVersion.scripts);
    const hideItems = scripts.length > hideItemsLength;
    const scriptsToDisplay = this.#sortScripts(this.isClosed ? scripts.slice(0, hideItemsLength) : scripts);

    if (scripts.length === 0) {
      return nothing;
    }

    return html`
    <div class="head-title no-margin" id="script-title">
        <p>npm scripts</p>
      </div>
    <div class="package-scripts">
      ${repeat(scriptsToDisplay,
        (script) => script,
        ([scriptName, scriptContent]) => {
          const isSuspicious = this.#isSuspicious(scriptName);
          const scriptClasses = classMap({
            script: true,
            suspicious: isSuspicious
          });

          return html`
        <div class=${scriptClasses}>
          ${when(isSuspicious,
            () => html`<p class="name">${`⚠️ ${scriptName}`}</p>`,
            () => html`<p class="name">${scriptName}</p>`
          )}
          <p class="value">${scriptContent}</p>
        </div>
        `;
        }
      )}
    ${when(hideItems,
      () => html`<expandable-span .isClosed=${this.isClosed} .onToggle=${() => {
        this.isClosed = !this.isClosed;
      }}></expandable-span>`,
      () => nothing
    )}
    </div>
   `;
  }

  #sortScripts(scripts) {
    return [...scripts.filter(([scriptName]) => this.#isSuspicious(scriptName)),
      ...scripts.filter(([scriptName]) => !this.#isSuspicious(scriptName))];
  }

  #isSuspicious(scriptName) {
    return kUnsafeNpmScripts.has(scriptName);
  }

  #renderDependencies() {
    const { composition } = this.package.dependencyVersion;

    const lang = utils.currentLang();
    const i18n = window.i18n[lang];

    return html`
    ${when(composition.unused.length > 0,
      () => html`
    <div class="head-title">
      <p>${i18n.package_info.title.unused_deps}</p>
    </div>
    <div  id="unuseddep">
      <items-list
        .items=${composition.unused}
        .shouldShowEveryItems=${true}
      ></items-list>
    </div>
    `,
      () => nothing
    )}
    ${when(composition.missing.length > 0,
      () => html`
      <div class="head-title">
        <p>${i18n.package_info.title.missing_deps}</p>
      </div>
      <div  id="missingdep">
        <items-list
        .items=${composition.missing}
        .shouldShowEveryItems=${true}
        variant="line"
        ></items-list>
      </div>
    `,
      () => nothing
    )}
    ${when(composition.required_nodejs.length > 0,
      () => html`
      <div class="head-title">
        <p>${i18n.package_info.title.node_deps}</p>
      </div>
      <div  id="nodedep">
        <items-list
        .items=${composition.required_nodejs}
        .shouldShowEveryItems=${true}
        .onClickItem=${(coreModuleName) => this.#openNodeDocumentation(coreModuleName)}
        ></items-list>
      </div>
    `,
      () => nothing
    )}
    ${when(composition.required_thirdparty.length > 0,
      () => html`
      <div class="head-title">
        <p>${i18n.package_info.title.third_party_deps}</p>
        ${this.#showHideDependenciesInTree()}
      </div>
      <div id="requireddep">
        <items-list
         variant="line"
        .items=${composition.required_thirdparty}
        .onClickItem=${(packageName) => this.package.nsn.focusNodeByName(packageName)}
        ></items-list>
      </div>
    `,
      () => nothing
    )}
       `;
  }

  #openNodeDocumentation = (coreModuleName) => {
    const name = coreModuleName.startsWith("node:") ?
      coreModuleName.slice(5) : coreModuleName;

    window
      .open(`https://nodejs.org/dist/latest/docs/api/${name}.html`, "_blank")
      .focus();
  };

  #showHideDependenciesInTree() {
    if (this.package.currentNode === 0) {
      return html`<span class="disabled" id="show-hide-dependency">hide</span>`;
    }

    if (this.package.dependency.metadata.dependencyCount === 0) {
      return html`
        <span class="disabled" id="show-hide-dependency">
          ${this.#renderEyeIcon()}
        </span>`;
    }

    return html`
        <span
          class=${this.isHidden ? "" : "active"}
          id="show-hide-dependency"
          @click=${() => {
              this.isHidden = !this.isHidden;

              this.package.nsn.highlightNodeNeighbour(this.package.currentNode, this.isHidden);
              if (Scripts.SimulationTimeout !== null) {
                clearTimeout(Scripts.SimulationTimeout);
              }
              Scripts.SimulationTimeout = setTimeout(() => {
                this.package.nsn.network.stopSimulation();
                Scripts.SimulationTimeout = null;
              }, 500);

              this.package.dependencyVersion.hidden = !this.package.dependencyVersion.hidden;
            }
          }
        >
          ${this.#renderEyeIcon()}
        </span>`;
  }

  #renderEyeIcon() {
    return html`
    ${when(this.isHidden,
      () => html`<nsecure-icon name="eye"></nsecure-icon> show`,
      () => html`<nsecure-icon name="eye-off"></nsecure-icon> hide`
    )}
  `;
  }
}

customElements.define("package-scripts", Scripts);
