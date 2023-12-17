import hljs from "highlight.js/lib/core";
window.hljs = hljs;
require("highlightjs-line-numbers.js/dist/highlightjs-line-numbers.min.js");

// CONSTANTS
const kLoadingMessage = "Loading ...";

function removeTags(str) {
  if (str === null || str === "") {
    return false;
  }

  return str.toString().replace(/(<([^>]+)>)/ig, "");
}

export class CodeFetcher {
  static setupDocumentClickHandler = true;

  static getLineFromFile(code, location) {
    const [[startLine]] = location;

    return code.split("\n").slice(startLine >= 10 ? startLine - 10 : 0, startLine + 10).join("\n");
  }

  static hide(event) {
    const packageCodeElement = document.querySelector(".package-code");
    if (!packageCodeElement) {
      return;
    }

    if (
      (packageCodeElement.innerText && packageCodeElement.innerText !== kLoadingMessage) &&
      !packageCodeElement.contains(event.target)
      && packageCodeElement.style.visibility === "visible"
    ) {
      packageCodeElement.style.visibility = "hidden";
      packageCodeElement.innerText = "";
    }
  }

  constructor(unpkgRoot) {
    this.unpkgRoot = unpkgRoot;

    this.cache = new Map();
    if (CodeFetcher.setupDocumentClickHandler) {
      document.addEventListener("click", CodeFetcher.hide);
      CodeFetcher.setupDocumentClickHandler = false;
    }
  }

  async fetchCodeLine(event, options = {}) {
    const { file, location, id, value } = options;

    this.container = document.querySelector(".package-code");
    this.container.style.visibility = "visible";
    const isJS = file.slice(-3) === ".js" || [".cjs", ".mjs"].includes(file.slice(-4));
    const isJSON = file.slice(-5) === ".json";

    if (this.cache.has(id)) {
      this.container.innerHTML = this.cache.get(id);
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
      codeElement.setAttribute("data-ln-start-from", location[0][0] >= 10 ? location[0][0] - 9 : 1);

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
          const tdsElement = codeElement.parentElement.querySelectorAll("table tbody tr td:nth-child(2)");
          for (let i = 0; i < tdsElement.length; i++) {
            const tdElement = tdsElement[i];

            if (lineIndex <= i && endLine >= startFrom + i) {
              console.log("ta mere nan ?");
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

            // eslint-disable-next-line max-len
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
