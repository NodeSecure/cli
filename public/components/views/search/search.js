// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

// Import Internal Dependencies
import { debounce } from "../../../common/utils.js";

export class SearchView {
  /**
   * @param {!NodeSecureDataSet} secureDataSet
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
    this.searchForm = document.querySelector("#search--view form");
    const input = this.searchForm.querySelector("input");

    input.addEventListener("input", debounce(async() => {
      document.querySelector(".result-container")?.remove();
      const packageName = input.value;
      if (packageName.length === 0) {
        return;
      }

      const { result, count } = await getJSON(`/search/${encodeURIComponent(packageName)}`);

      const divResultContainer = document.createElement("div");
      divResultContainer.classList.add("result-container");

      for (const { name, version, description } of result) {
        const divResultElement = document.createElement("div");
        divResultElement.classList.add("result");

        const pkgElement = document.createElement("div");
        pkgElement.classList.add("package-result");
        const pkgSpanElement = document.createElement("span");
        pkgSpanElement.textContent = name;
        pkgSpanElement.addEventListener("click", async() => {
          const selectSelectedOption = divResultElement.querySelector("select option:checked");
          await this.fetchPackage(name, selectSelectedOption.value);
        });
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
          const versions = await this.fetchPackageVersions(name);
          for (const pkgVersion of versions) {
            if (pkgVersion === version) {
              continue;
            }
            const optionElement = document.createElement("option");
            optionElement.value = pkgVersion;
            optionElement.textContent = pkgVersion;
            selectElement.appendChild(optionElement);
          }
        }, { once: true });
        divResultElement.appendChild(selectElement);
        divResultContainer.appendChild(divResultElement);
      }
      this.searchForm.appendChild(divResultContainer);
    }, 500));

    this.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });
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
    const searchViewContainer = document.querySelector("#search--view .container");
    searchViewContainer.innerHTML = "";
    const form = document.createElement("form");
    const formGroup = document.createElement("div");
    formGroup.classList.add("form-group");
    const iconSearch = document.createElement("i");
    iconSearch.classList.add("icon-search");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "fastify, express...";
    input.name = "package";
    input.id = "package";
    formGroup.appendChild(iconSearch);
    formGroup.appendChild(input);
    form.appendChild(formGroup);
    searchViewContainer.appendChild(form);

    this.initialize();
  }

  onScan(pkg) {
    const searchViewForm = document.querySelector("#search--view form");
    searchViewForm.remove();

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
