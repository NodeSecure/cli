// Import Third-party Dependencies
import hljsCore from "highlight.js/lib/core";
// @ts-expect-error - vendor script loaded via require(), the target resolves to a physical
// non-module file that TS insists on type-checking; there are no type declarations to satisfy.
require("highlightjs-line-numbers.js/dist/highlightjs-line-numbers.min.js");

// The `highlightjs-line-numbers.js` plugin patches `hljsCore` with `initLineNumbersOnLoad`
// at runtime (via the `require` above), a shape TS's static `HLJSApi` type doesn't know about.
const hljs = /** @type {import("highlight.js").HLJSApi & { initLineNumbersOnLoad(): void }} */ (
  /** @type {unknown} */ (hljsCore)
);
window.hljs = hljs;

// CONSTANTS
const kLoadingMessage = "Loading ...";

/**
 * @typedef {[[number, number], [number, number]]} CodeLocation
 */

/**
 * @param {string | null} str
 */
function removeTags(str) {
  if (str === null || str === "") {
    return false;
  }

  return str.toString().replace(/(<([^>]+)>)/ig, "");
}

export class CodeFetcher {
  static setupDocumentClickHandler = true;

  /**
   * @param {string} code
   * @param {CodeLocation} location
   */
  static getLineFromFile(code, location) {
    const [[startLine]] = location;

    return code.split("\n").slice(startLine >= 10 ? startLine - 10 : 0, startLine + 10).join("\n");
  }

  /**
   * @param {MouseEvent} event
   */
  static hide(event) {
    const packageCodeElement = /** @type {HTMLElement | null} */ (document.querySelector(".package-code"));
    if (!packageCodeElement) {
      return;
    }

    if (
      (packageCodeElement.innerText && packageCodeElement.innerText !== kLoadingMessage) &&
      !packageCodeElement.contains(/** @type {Node} */ (event.target))
      && packageCodeElement.style.visibility === "visible"
    ) {
      packageCodeElement.style.visibility = "hidden";
      packageCodeElement.innerText = "";
    }
  }

  /**
   * @param {string | null} unpkgRoot
   */
  constructor(unpkgRoot) {
    this.unpkgRoot = unpkgRoot;

    /** @type {Map<string, string>} */
    this.cache = new Map();
    /** @type {HTMLElement} */
    this.container = /** @type {any} */ (undefined);
    if (CodeFetcher.setupDocumentClickHandler) {
      document.addEventListener("click", CodeFetcher.hide);
      CodeFetcher.setupDocumentClickHandler = false;
    }
  }

  /**
   * @param {Event} event
   * @param {{ file: string, location: CodeLocation, id: string, value: string | null }} options
   */
  async fetchCodeLine(event, options) {
    const { file, location, id, value } = options;

    this.container = /** @type {HTMLElement} */ (document.querySelector(".package-code"));
    this.container.style.visibility = "visible";
    const isJS = file.slice(-3) === ".js" || [".cjs", ".mjs"].includes(file.slice(-4));
    const isJSON = file.slice(-5) === ".json";

    if (this.cache.has(id)) {
      this.container.innerHTML = /** @type {string} */ (this.cache.get(id));
      hljs.initLineNumbersOnLoad();
      event.stopPropagation();

      return;
    }

    this.container.innerText = kLoadingMessage;
    const code = await fetch(`${this.unpkgRoot}${file}`).then((response) => response.text());

    if (code.length) {
      this.container.innerText = "";

      const titleElement = document.createElement("div");
      titleElement.classList.add("file");
      titleElement.innerHTML = `<a href="${this.unpkgRoot}${file}" target="_blank">${file}</a>`;

      const preElement = document.createElement("pre");
      preElement.appendChild(titleElement);

      const codeElement = document.createElement("code");
      codeElement.textContent = CodeFetcher.getLineFromFile(code, location);
      // eslint-disable-next-line no-nested-ternary
      codeElement.classList.add(`language-${isJS ? "js" : isJSON ? "json" : "text"}`, "hljs");
      codeElement.setAttribute("data-ln-start-from", String(location[0][0] >= 10 ? location[0][0] - 9 : 1));

      preElement.appendChild(codeElement);
      this.container.appendChild(preElement);
      hljs.highlightElement(codeElement);
      hljs.initLineNumbersOnLoad();

      // Highlight the relevant lines / code
      const [[startLine], [endLine, endColumn]] = location;
      const isMultiLine = startLine < endLine;
      const lineIndex = startLine >= 10 ? 9 : startLine - 1;
      const startFrom = startLine >= 10 ? startLine - 9 : 1;

      if (isMultiLine) {
        setTimeout(() => {
          const tdsElement = /** @type {HTMLElement} */ (
            codeElement.parentElement
          ).querySelectorAll("table tbody tr td:nth-child(2)");
          for (let i = 0; i < tdsElement.length; i++) {
            const tdElement = tdsElement[i];

            if (lineIndex <= i && endLine >= startFrom + i) {
              tdElement.classList.add("relevant-line");
            }
          }
        });
      }
      else {
        codeElement.innerHTML = codeElement.innerHTML.split("\n").map((line, index) => {
          const withoutTags = removeTags(line);
          if (withoutTags === false) {
            return line;
          }

          if (value && line.includes(value)) {
            const indexStart = line.indexOf(value);

            // eslint-disable-next-line @stylistic/max-len
            return `${line.slice(0, indexStart)}<span class="relevant-line">${line.slice(indexStart, indexStart + endColumn)}</span>${line.slice(indexStart + endColumn)}`;
          }
          else if (startFrom + index === startLine) {
            return `<span class="relevant-line">${line}</span>`;
          }

          return line;
        }).join("\n");
      }
    }
    else {
      this.container.innerText = "Line not found ...";
    }

    this.cache.set(id, this.container.innerHTML);

    event.stopPropagation();
  }
}
