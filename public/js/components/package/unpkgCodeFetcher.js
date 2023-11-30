// CONSTANTS
const kLoadingMessage = "Loading ...";

export class UnpkgCodeFetcher {
  static setupDocumentClickHandler = true;

  static getLineFromFile(code, location) {
    const [[startLine]] = location;

    return code.split('\n')[startLine - 1];
  }

  static hide(event) {
    const tooltip = document.querySelector('.package-code');
    if (!tooltip) {
      return;
    }

    if (
      (tooltip.innerHTML && tooltip.innerHTML !== kLoadingMessage) &&
      !tooltip.contains(event.target)
      && tooltip.style.visibility === "visible"
    ) {
      tooltip.style.visibility = "hidden";
      tooltip.innerHTML = "";
    }
  }

  constructor(unpkgRoot) {
    this.unpkgRoot = unpkgRoot;

    this.cache = new Map();
    if (UnpkgCodeFetcher.setupDocumentClickHandler) {
      document.addEventListener("click", UnpkgCodeFetcher.hide);
      UnpkgCodeFetcher.setupDocumentClickHandler = false;
    }
  }

  async fetchCodeLine(event, options = {}) {
    const { file, location, id } = options;

    this.container = document.querySelector(".package-code");
    this.container.style.visibility = 'visible';

    if (this.cache.has(id)) {
      this.container.innerText = this.cache.get(id);
      event.stopPropagation();

      return;
    }

    this.container.innerText = kLoadingMessage;
    const code = await fetch(`${this.unpkgRoot}${file}`).then((response) => response.text());

    this.container.innerText = code.length ?
      UnpkgCodeFetcher.getLineFromFile(code, location) :
      "Line not found ...";
    this.cache.set(id, this.container.innerText);

    event.stopPropagation();
  }
}
