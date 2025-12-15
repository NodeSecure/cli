// Import Internal Dependencies
import { SearchBar } from "../components/searchbar/searchbar";
import "../components/package-navigation/package-navigation.js";

export function initSearchNav(
  data,
  options
) {
  const {
    initFromZero = true,
    searchOptions = null
  } = options;

  const searchNavElement = document.getElementById("search-nav");
  if (!searchNavElement) {
    throw new Error("Unable to found search navigation");
  }

  if (initFromZero) {
    searchNavElement.innerHTML = "";
    const element = document.createElement("package-navigation");
    searchNavElement.appendChild(
      element
    );
    element.metadata = data;
    element.activePackage = data.length > 0 ? data[0].spec : "";
  }

  if (searchOptions !== null) {
    const { nsn, secureDataSet } = searchOptions;

    if (window.searchbar) {
      console.log("[SEARCH-NAV] cleanup searchbar");
      document.getElementById("searchbar")?.remove();
    }

    const searchElement = document.getElementById("searchbar-content");
    searchNavElement.appendChild(
      searchElement.content.cloneNode(true)
    );

    const searchBarPackagesContainer = document.getElementById("package-list");
    for (const info of secureDataSet.packages) {
      const content = `<p>${info.flags} ${info.name}</p><b>${info.version}</b>`;
      searchBarPackagesContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="package hide" data-value="${info.id}">${content}</div>`
      );
    }
    window.searchbar = new SearchBar(nsn, secureDataSet.linker);
  }
}
