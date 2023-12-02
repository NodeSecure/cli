// CONSTANTS
const kLoadingMessage = "Loading ...";

export class CodeFetcher {
  static setupDocumentClickHandler = true;

  static getLineFromFile(code, location) {
    const [[startLine]] = location;

    return code.split("\n")[startLine - 1];
  }

  static hide(event) {
    const packageCodeElement = document.querySelector(".package-code");
    if (!packageCodeElement) {
      return;
    }

    if (
      (packageCodeElement.innerHTML && packageCodeElement.innerHTML !== kLoadingMessage) &&
      !packageCodeElement.contains(event.target)
      && packageCodeElement.style.visibility === "visible"
    ) {
      packageCodeElement.style.visibility = "hidden";
      packageCodeElement.innerHTML = "";
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
    const { file, location, id } = options;

    this.container = document.querySelector(".package-code");
    this.container.style.visibility = "visible";

    if (this.cache.has(id)) {
      this.container.innerText = this.cache.get(id);
      event.stopPropagation();

      return;
    }

    this.container.innerText = kLoadingMessage;
    const code = await fetch(`${this.unpkgRoot}${file}`).then((response) => response.text());

    this.container.innerText = code.length ?
      CodeFetcher.getLineFromFile(code, location) :
      "Line not found ...";
    this.cache.set(id, this.container.innerText);

    event.stopPropagation();
  }
}
