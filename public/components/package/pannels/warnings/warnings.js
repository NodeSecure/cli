// Import Third-party Dependencies
import { locationToString } from "@nodesecure/utils";

// Import Internal Dependencies
import "../../../file-box/file-box.js";
import { CodeFetcher } from "./code-fetcher.js";
import * as utils from "../../../../common/utils.js";

export class Warnings {
  constructor(pkg) {
    this.package = pkg;
  }

  get isPrincipalRootProject() {
    return this.package.currentNode === 0 ||
      this.package.dependencyVersion.flags.includes("isGit");
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    this.setupSignal(clone);
    clone.getElementById("pan-warnings")
      .appendChild(this.renderWarnings());

    clone.querySelectorAll(".open-wiki")
      .forEach((element) => element.addEventListener("click", () => this.openWiki()));
  }

  openWiki() {
    window.wiki.header.setNewActiveView("warnings");
    window.wiki.open();
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  setupSignal(clone) {
    const { warnings } = this.package.dependencyVersion;
    this.package.addNavigationSignal(
      clone.getElementById("warnings-nav-menu"),
      warnings.filter((warning) => !window.settings.config.ignore.warnings.has(warning.kind)).length
    );
  }

  renderWarnings() {
    const { warnings } = this.package.dependencyVersion;

    const fragment = document.createDocumentFragment();
    const unpkgRoot = this.package.links.unpkg.href;

    const codeFetcher = new CodeFetcher(unpkgRoot);

    for (const warning of warnings) {
      if (window.settings.config.ignore.warnings.has(warning.kind)) {
        continue;
      }

      const id = Math.random().toString(36).slice(2);
      const hasNoInspection =
        warning.file.includes(".min") ||
        warning.kind === "short-identifiers" ||
        warning.kind === "obfuscated-code" ||
        warning.kind === "zero-semver";

      const viewMoreElement = utils.createDOMElement("div", {
        className: "view-more",
        childs: [
          utils.createDOMElement("i", { className: "icon-code" })
        ]
      });

      if (this.isPrincipalRootProject || hasNoInspection) {
        viewMoreElement.style.display = "none";
      }
      else {
        const location = warning.kind === "encoded-literal" ? warning.location[0] : warning.location;

        viewMoreElement.addEventListener("click", (event) => {
          codeFetcher.fetchCodeLine(event, { file: warning.file, location, id, value: warning.value });
        });
      }

      const boxContainer = utils.createDOMElement("div", {
        classList: ["box-container-warning"],
        childs: [
          utils.createDOMElement("div", {
            className: "info",
            childs: [
              utils.createDOMElement("p", {
                className: "title",
                text: "incrimined value"
              }),
              utils.createDOMElement("p", {
                className: "value",
                text: warning.value && warning.value.length > 200 ? `${warning.value.slice(0, 200)}...` : warning.value
              })
            ]
          }),
          viewMoreElement
        ]
      });
      const boxPosition = warning.location === null ? null : utils.createDOMElement("div", {
        className: "box-source-code-position",
        childs: [
          utils.createDOMElement("p", {
            text: this.getWarningLocation(warning)
          })
        ]
      });

      const box = document.createElement("file-box");
      box.title = warning.kind;
      box.fileName = warning.file.length > 20 ? `${warning.file.slice(0, 20)}...` : warning.file;
      box.titleHref = warning.kind === "invalid-semver" ?
        null : `https://github.com/NodeSecure/js-x-ray/blob/master/docs/${warning.kind}.md`;
      box.fileHref = `${unpkgRoot}${warning.file}`;
      box.severity = warning.severity ?? "Information";
      box.appendChild(boxContainer);
      if (boxPosition) {
        box.appendChild(boxPosition);
      }
      fragment.appendChild(box);
    }

    return fragment;
  }

  getWarningLocation(warning) {
    if (warning.kind === "encoded-literal") {
      return warning.location
        .map((loc) => locationToString(loc)).join(" // ");
    }

    return locationToString(warning.location);
  }
}
