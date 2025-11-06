// Import Third-party Dependencies
import { getJSON, NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import Internal Dependencies
import { currentLang, debounce, createDOMElement, parseNpmSpec } from "../../../common/utils.js";

// CONSTANTS
const kMinPackageNameLength = 2;
const kMaxPackageNameLength = 64;

export class SearchView {
  /**
   * @type {NodeSecureDataSet}
   */
  secureDataSet;
  /**
   * @type {NodeSecureNetwork}
   */
  nsn;

  /**
   * @param {!NodeSecureDataSet} secureDataSet
   * @param {!NodeSecureNetwork} nsn
   */
  constructor(
    secureDataSet,
    nsn
  ) {
    this.secureDataSet = secureDataSet;
    this.nsn = nsn;

    this.mount();
    this.initialize();
  }

  mount() {
    const template = document.getElementById("search-view-template");
    /** @type {HTMLTemplateElement} */
    const clone = document.importNode(template.content, true);

    const view = document.getElementById("search--view");
    view.innerHTML = "";
    view.appendChild(clone);
  }

  initialize() {
    this.searchForm = document.querySelector("#search--view form");
    this.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });

    const input = this.searchForm.querySelector("input");
    input.addEventListener("input", debounce(async() => {
      await this.#handleSearchInput(input.value);
    }, 500));

    this.#initializePackages(
      ".cache-packages",
      window.scannedPackageCache
    );
    this.#initializePackages(
      ".recent-packages",
      window.recentPackageCache
    );
  }

  #initializePackages(
    selector,
    specs
  ) {
    const packagesElement = document.querySelector(`#search--view .container ${selector}`);
    if (!packagesElement) {
      return;
    }

    packagesElement.classList.toggle(
      "hidden",
      specs.length === 0
    );
    const fragment = document.createDocumentFragment();
    for (const spec of specs) {
      fragment.appendChild(this.#cachePackageElement(spec));
    }
    packagesElement.appendChild(fragment);
  }

  async #handleSearchInput(
    packageName
  ) {
    const lang = currentLang();
    const formGroup = this.searchForm.querySelector(".form-group");

    document.querySelector(".result-container")?.remove();
    this.searchForm.querySelector(".hint")?.remove();

    if (packageName.length === 0) {
      return;
    }
    else if (
      packageName.length < kMinPackageNameLength ||
      packageName.length > kMaxPackageNameLength
    ) {
      const hintElement = document.createElement("div");
      hintElement.classList.add("hint");
      hintElement.textContent = window.i18n[lang].search.packageLengthErr;
      this.searchForm.appendChild(hintElement);

      return;
    }

    const loaderElement = createDOMElement("div", {
      classList: ["spinner-small", "search-spinner"]
    });
    formGroup.appendChild(loaderElement);

    const { result, count } = await getJSON(`/search/${encodeURIComponent(packageName)}`);

    this.searchForm.querySelector(".spinner-small").remove();

    this.#displaySearchResults({ results: result, count, packageName, lang });
  }

  #displaySearchResults({ results, count, packageName, lang }) {
    const divResultContainer = document.createElement("div");
    divResultContainer.classList.add("result-container");

    if (count === 0) {
      const divResultElement = document.createElement("div");
      divResultElement.classList.add("result-not-found");
      divResultElement.textContent = window.i18n[lang].search.noPackageFound;
      divResultContainer.appendChild(divResultElement);
      this.searchForm.appendChild(divResultContainer);

      return;
    }

    for (const { name, version, description } of results) {
      const divResultElement = this.#createSearchResultElement({
        name,
        version,
        description,
        packageName
      });
      divResultContainer.appendChild(divResultElement);
    }

    this.searchForm.parentNode.insertBefore(divResultContainer, this.searchForm.nextSibling);
  }

  #createSearchResultElement({ name, version, description, packageName }) {
    const divResultElement = document.createElement("div");
    divResultElement.classList.add("result");
    if (packageName === name) {
      divResultElement.classList.add("exact");
    }

    const pkgElement = document.createElement("div");
    pkgElement.classList.add("package-result");
    const pkgSpanElement = document.createElement("span");
    pkgSpanElement.textContent = name;
    pkgSpanElement.addEventListener("click", () => {
      const packageVersion = divResultElement.querySelector("select option:checked");
      this.fetchPackage(name, packageVersion.value);
    }, { once: true });
    pkgElement.appendChild(pkgSpanElement);

    const pkgDescriptionElement = document.createElement("p");
    pkgDescriptionElement.textContent = description;
    pkgDescriptionElement.classList.add("description");
    pkgElement.appendChild(pkgDescriptionElement);
    divResultElement.appendChild(pkgElement);

    const selectElement = this.#createVersionSelect(name, version);
    divResultElement.appendChild(selectElement);

    return divResultElement;
  }

  #createVersionSelect(name, version) {
    const selectElement = document.createElement("select");
    const optionElement = document.createElement("option");
    optionElement.value = version;
    optionElement.textContent = version;
    selectElement.appendChild(optionElement);

    selectElement.addEventListener("click", async() => {
      const spinnerOption = "<option value=\"\" disabled class=\"spinner-option\">.</option>";
      selectElement.insertAdjacentHTML("beforeend", spinnerOption);

      function spinnerOptionSpin() {
        const spinnerOptionElement = selectElement.querySelector(".spinner-option");
        spinnerOptionElement.textContent += ".";
        if (spinnerOptionElement.textContent.length > 3) {
          spinnerOptionElement.textContent = ".";
        }
      }

      const spinIntervalId = setInterval(spinnerOptionSpin, 180);

      try {
        const versions = await this.fetchPackageVersions(name);

        clearInterval(spinIntervalId);
        selectElement.querySelector(".spinner-option").remove();

        for (const pkgVersion of versions) {
          if (pkgVersion === version) {
            continue;
          }
          const optionElement = document.createElement("option");
          optionElement.value = pkgVersion;
          optionElement.textContent = pkgVersion;
          selectElement.appendChild(optionElement);
        }
      }
      catch {
        clearInterval(spinIntervalId);
        selectElement.querySelector(".spinner-option").remove();
      }
    }, { once: true });

    return selectElement;
  }

  #cachePackageElement(pkg) {
    const { name, version, local } = parseNpmSpec(pkg);
    const pkgElement = document.createElement("div");
    pkgElement.classList.add("package-cache-result");

    const pkgSpanElement = document.createElement("span");
    pkgSpanElement.innerHTML = `${name}@${version}${local ? " <b>local</b>" : ""}`;
    pkgSpanElement.addEventListener("click", () => {
      window.socket.send(JSON.stringify({ action: "SEARCH", pkg }));
    }, { once: true });

    const removeButton = createDOMElement("button", {
      classList: ["remove"],
      text: "x"
    });
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      window.socket.send(JSON.stringify({ action: "REMOVE", pkg }));
    }, { once: true });

    pkgElement.append(pkgSpanElement, removeButton);

    return pkgElement;
  }

  fetchPackage(packageName, version) {
    const pkg = `${packageName}@${version}`;

    window.socket.send(JSON.stringify({ action: "SEARCH", pkg }));
  }

  async fetchPackageVersions(packageName) {
    const versions = await getJSON(`/search-versions/${encodeURIComponent(packageName)}`);

    return versions.reverse();
  }

  onScan(pkg) {
    const searchViewForm = document.querySelector("#search--view form");
    searchViewForm?.remove();
    const containerResult = document.querySelector("#search--view .result-container");
    containerResult?.remove();

    const searchViewContainer = document.querySelector("#search--view .container");
    const scanInfo = document.createElement("div");
    scanInfo.classList.add("scan-info");
    scanInfo.textContent = `Scanning ${pkg}.`;
    const spinner = document.createElement("div");
    spinner.classList.add("spinner");
    searchViewContainer.appendChild(scanInfo);
    searchViewContainer.appendChild(spinner);
  }
}
