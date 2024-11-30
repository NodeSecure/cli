// Import Internal Dependencies
import { createDOMElement, parseNpmSpec } from "../common/utils";
import { SearchBar } from "../components/searchbar/searchbar";

// CONSTANTS
const kSearchbarId = "searchbar-tpl";

export function initSearchNav(data, nsn, secureDataSet) {
  const searchNavElement = document.getElementById("search-nav");
  // reset
  searchNavElement.innerHTML = "";
  const pkgs = data.lru;
  const hasAtLeast2Packages = pkgs.length > 1;
  const hasExactly2Packages = pkgs.length === 2;
  const packagesContainer = document.createElement("div");
  packagesContainer.classList.add("packages");

  for (const pkg of pkgs) {
    // Initialize Search nav
    const { name, version } = parseNpmSpec(pkg);

    const pkgElement = createDOMElement("div", {
      classList: ["package"],
      childs: [
        createDOMElement("p", { text: name }),
        createDOMElement("b", { text: `v${version}` })
      ]
    });
    if (pkg === data.current) {
      window.activePackage = pkg;
      pkgElement.classList.add("active");
    }
    pkgElement.addEventListener("click", () => {
      if (window.activePackage !== pkg) {
        window.socket.send(JSON.stringify({ pkg, action: "SEARCH" }));
      }
    });

    if (hasAtLeast2Packages && pkg !== data.root) {
      addRemoveButton(pkgElement, { hasExactly2Packages });
    }

    packagesContainer.appendChild(pkgElement);
  }

  searchNavElement.appendChild(packagesContainer);

  const plusButtonElement = document.createElement("button");
  plusButtonElement.classList.add("add");
  plusButtonElement.appendChild(createDOMElement("p", { text: "+" }));
  plusButtonElement.addEventListener("click", () => {
    window.navigation.setNavByName("search--view");
  });

  searchNavElement.appendChild(plusButtonElement);

  const searchElement = document.getElementById(kSearchbarId);
  const searchElementClone = searchElement.content.cloneNode(true);
  searchNavElement.appendChild(searchElementClone);

  // Initialize searchbar
  {
    const dataListElement = document.getElementById("package-list");
    for (const info of secureDataSet.packages) {
      const content = `<p>${info.flags} ${info.name}</p><b>${info.version}</b>`;
      dataListElement.insertAdjacentHTML("beforeend", `<div class="package hide" data-value="${info.id}">${content}</div>`);
    }
  }
  window.searchbar = new SearchBar(nsn, secureDataSet.linker);
}

function addRemoveButton(pkgElement, options) {
  const {
    hasExactly2Packages
  } = options;
  // we allow to remove a package when at least 2 packages are present
  const removeButton = document.createElement("button");
  removeButton.classList.add("remove");
  removeButton.textContent = "x";
  removeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    // we remove the x button from textContent
    const pkgToRemove = pkgElement.textContent.slice(0, -1);
    window.socket.send(JSON.stringify({ action: "REMOVE", pkg: pkgToRemove }));

    if (hasExactly2Packages) {
      const allPackages = [...document.getElementById("search-nav").querySelectorAll(".package")];
      for (const pkg of allPackages) {
        const removeBtn = pkg.querySelector(".remove");
        if (removeBtn) {
          removeBtn.remove();
        }
      }
    }
  }, { once: true });
  pkgElement.appendChild(removeButton);
}
