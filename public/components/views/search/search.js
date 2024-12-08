// Import Third-party Dependencies
import { getJSON, NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import Internal Dependencies
import { currentLang, debounce, createDOMElement } from "../../../common/utils.js";

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

    this.initialize();
  }

  initialize() {
    this.searchContainer = document.querySelector("#search--view .container");
    this.searchForm = document.querySelector("#search--view form");
    const formGroup = this.searchForm.querySelector(".form-group");
    const input = this.searchForm.querySelector("input");
    const lang = currentLang();

    input.addEventListener("input", debounce(async() => {
      document.querySelector(".result-container")?.remove();
      this.searchForm.querySelector(".hint")?.remove();

      const packageName = input.value;
      if (packageName.length === 0) {
        return;
      }
      else if (packageName.length < kMinPackageNameLength || packageName.length > kMaxPackageNameLength) {
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

      for (const { name, version, description } of result) {
        const divResultElement = document.createElement("div");
        divResultElement.classList.add("result");
        if (packageName === name) {
          divResultElement.classList.add("exact");
        }

        const pkgElement = document.createElement("div");
        pkgElement.classList.add("package-result");
        const pkgSpanElement = document.createElement("span");
        pkgSpanElement.textContent = name;
        pkgSpanElement.addEventListener("click", async() => {
          const packageVersion = divResultElement.querySelector("select option:checked");
          await this.fetchPackage(name, packageVersion.value);
        }, { once: true });
        pkgElement.appendChild(pkgSpanElement);
        const pkgDescriptionElement = document.createElement("p");
        pkgDescriptionElement.textContent = description;
        pkgDescriptionElement.classList.add("description");
        pkgElement.appendChild(pkgDescriptionElement);
        divResultElement.appendChild(pkgElement);

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
        divResultElement.appendChild(selectElement);
        divResultContainer.appendChild(divResultElement);
      }
      this.searchForm.parentNode.insertBefore(divResultContainer, this.searchForm.nextSibling);
    }, 500));

    this.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });

    const cachePackagesElement = this.searchContainer.querySelector(".cache-packages");
    if (cachePackagesElement === null) {
      return;
    }
    if (window.scannedPackageCache.length > 0) {
      cachePackagesElement.classList.remove("hidden");
      const h1Element = document.createElement("h1");
      h1Element.textContent = window.i18n[lang].search.packagesCache;
      cachePackagesElement.appendChild(h1Element);

      for (const pkg of window.scannedPackageCache) {
        const pkgElement = document.createElement("div");
        pkgElement.classList.add("package-result");
        const pkgSpanElement = document.createElement("span");
        pkgSpanElement.textContent = pkg;
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
        cachePackagesElement.appendChild(pkgElement);
      }
    }
    else {
      cachePackagesElement.classList.add("hidden");
    }
  }

  async fetchPackage(packageName, version) {
    const pkg = `${packageName}@${version}`;

    window.socket.send(JSON.stringify({ action: "SEARCH", pkg }));
  }

  async fetchPackageVersions(packageName) {
    const versions = await getJSON(`/search-versions/${encodeURIComponent(packageName)}`);

    return versions.reverse();
  }

  reset() {
    const lang = currentLang();

    const searchViewContainer = document.querySelector("#search--view .container");
    searchViewContainer.innerHTML = "";
    const form = document.createElement("form");
    const formGroup = document.createElement("div");
    formGroup.classList.add("form-group");
    const iconSearch = document.createElement("i");
    iconSearch.classList.add("icon-search");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = window.i18n[lang].search.registryPlaceholder;
    input.name = "package";
    input.id = "package";
    formGroup.appendChild(iconSearch);
    formGroup.appendChild(input);
    form.appendChild(formGroup);
    searchViewContainer.appendChild(form);

    const cachePackagesElement = document.createElement("div");
    cachePackagesElement.classList.add("cache-packages", "hidden");
    searchViewContainer.appendChild(cachePackagesElement);

    this.initialize();
  }

  onScan(pkg) {
    const searchViewForm = document.querySelector("#search--view form");
    searchViewForm.remove();
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
