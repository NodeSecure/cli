"use strict";

// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";
import { NodeSecureDataSet, NodeSecureNetwork, getFlagsEmojisInlined } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "./utils.js";
import * as popup from "./popup.js";
import SearchBar from "./searchbar.js";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const modal = document.querySelector(".modal");
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      toggleModal();
    }
  });

  const secureDataSet = new NodeSecureDataSet();
  await secureDataSet.init();

  document.getElementById("legend_popup_btn").addEventListener("click", () => {
    toggleModal("popup-legends");
    const legendsFlagsFragment = document.createDocumentFragment();
    for (const { title, emoji } of Object.values(secureDataSet.FLAGS)) {
      legendsFlagsFragment.appendChild(utils.createLegend(emoji, title));
    }
    legendsFlagsFragment.appendChild(utils.createLegend("🎭", "isDuplicate"));
    document.getElementById("flag-legends").appendChild(legendsFlagsFragment);
  });
  document.querySelector(".close-button").addEventListener("click", () => toggleModal());

  // Setup warnings
  if (secureDataSet.warnings.length === 0) {
    document.getElementById("global_warnings").style.display = "none";
  }
  else {
    const fragment = document.createDocumentFragment();
    for (const text of secureDataSet.warnings) {
      const pElement = utils.createDOMElement("p", { text });
      fragment.appendChild(utils.createDOMElement("div", { classList: ["warning"], childs: [pElement] }));
    }

    document.querySelector("#global_warnings > p").textContent = secureDataSet.warnings.length;
    document.getElementById("warnings_box").appendChild(fragment);
  }

  {
    const { name, version } = secureDataSet.linker.get(0);
    const nameElement = document.getElementById("main-project-name");
    if (name.length > 17) {
      nameElement.style["font-size"] = "16px";
    }
    nameElement.textContent = name;
    document.getElementById("main-project-version").textContent = `version ${version}`;
    document.querySelector(".current-project").addEventListener("click", () => nsn.focusNodeById(0));
  }

  // Setup global stats
  document.getElementById("total-packages").innerHTML = secureDataSet.dependenciesCount;
  document.getElementById("indirect-dependencies").innerHTML = secureDataSet.indirectDependencies;
  document.getElementById("total-size").innerHTML = secureDataSet.prettySize;
  {
    const licenseFragment = document.createDocumentFragment();
    const licensesEntries = [...Object.entries(secureDataSet.licenses)].sort(([, left], [, right]) => right - left);

    for (const [licenseName, licenseCount] of licensesEntries) {
      if (licenseCount === 0) {
        continue;
      }
      const divElement = utils.createDOMElement("div", {
        classList: ["license", "stat-case"],
        text: `${licenseName} (${licenseCount})`
      });
      licenseFragment.appendChild(divElement);
    }
    document.getElementById("license-counts").appendChild(licenseFragment);
  }

  {
    const extFragment = document.createDocumentFragment();
    const extEntries = [...Object.entries(secureDataSet.extensions)].sort(([, left], [, right]) => right - left);

    for (const [extName, extCount] of extEntries) {
      const divElement = utils.createDOMElement("div", {
        classList: ["ext", "stat-case"],
        text: `${extName} (${extCount})`
      });
      extFragment.appendChild(divElement);
    }
    document.getElementById("extensions-counts").appendChild(extFragment);
  }

  {
    document.getElementById("stat-maintainers-title").textContent = `${secureDataSet.authors.size} Maintainers`;
    const authorsFragment = document.createDocumentFragment();
    for (const [name, desc] of secureDataSet.authors.entries()) {
      authorsFragment.appendChild(utils.createAvatar(name, desc));
    }
    document.getElementById("maintainers-list").appendChild(authorsFragment);
  }

  // Initialize vis Network
  const nsn = new NodeSecureNetwork(secureDataSet);
  nsn.network.on("click", updateShowInfoMenu);

  // Initialize searchbar
  {
    const dataListElement = document.getElementById("package-list");
    for (const info of secureDataSet.packages) {
      const content = `<p>${info.flags} ${info.name}</p><b>${info.version}</b>`;
      dataListElement.insertAdjacentHTML("beforeend", `<div class="package hide" data-value="${info.id}">${content}</div>`);
    }
  }
  new SearchBar(nsn, secureDataSet.linker);

  async function updateShowInfoMenu(params) {
    const showInfoElem = document.getElementById("show-info");
    const packageInfoTemplate = document.getElementById("package-info");

    if (params.nodes.length === 0) {
      const template = document.getElementById("left-menu-desc");
      showInfoElem.innerHTML = "";
      showInfoElem.appendChild(document.importNode(template.content, true));

      return;
    }
    showInfoElem.innerHTML = "";

    const clone = document.importNode(packageInfoTemplate.content, true);
    const currentNode = params.nodes[0];
    const selectedNode = secureDataSet.linker.get(Number(currentNode));
    const { name, version, author, flags, composition, warnings, usedBy } = selectedNode;
    const { metadata, vulnerabilities } = secureDataSet.data.dependencies[name];

    const btnShow = clone.getElementById("btn_showOrHide");
    const btnVuln = clone.getElementById("btn_vuln");
    {
      btnShow.innerHTML = "";
      const template = document.getElementById(selectedNode.hidden ? "show-children" : "hide-children");
      btnShow.appendChild(document.importNode(template.content, true));
    }

    if (metadata.dependencyCount === 0) {
      btnShow.classList.add("disabled");
    }
    else {
      btnShow.addEventListener("click", function showOrHide() {
        const currBtn = document.getElementById("btn_showOrHide");
        currBtn.classList.toggle("active");
        const hidden = !selectedNode.hidden;

        currBtn.innerHTML = "";
        const template = document.getElementById(hidden ? "show-children" : "hide-children");
        currBtn.appendChild(document.importNode(template.content, true));

        nsn.highlightNodeNeighbour(currentNode, hidden);
        selectedNode.hidden = !selectedNode.hidden;
      });
    }

    vulnerabilities.length === 0 && btnVuln.classList.add("disabled");
    {
      const nameElement = clone.querySelector(".name");
      if (name.length > 16) {
        nameElement.style["font-size"] = "18px";
      }
      nameElement.textContent = name;
    }
    clone.querySelector(".version").textContent = version;
    {
      const descElement = clone.querySelector(".desc");
      const desc = selectedNode.description.trim();
      if (desc === "") {
        descElement.style.display = "none";
      }
      else {
        descElement.textContent = desc;
        if (desc.length <= 60) {
          descElement.style["text-align"] = "center";
        }
      }
    }

    let fAuthor = typeof author === "string" ? author : (author.name || "Unknown");
    fAuthor = fAuthor.length > 26 ? `${fAuthor.slice(0, 26)}...` : fAuthor;

    const lastUpdate = Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    }).format(new Date(metadata.lastUpdateAt));

    {
      const npmHomePageURL = `https://www.npmjs.com/package/${name}/v/${version}`;
      const licenses = selectedNode.license === "unkown license" ?
        "unkown license" : selectedNode.license.uniqueLicenseIds.join(", ");
      const licenseModal = popup.openLicenseModal({ licenses, selectedNode });
      const warningsModal = popup.openWarningsModal({
        name, version, npmHomePageURL, homepage: metadata.homepage, warnings
      });

      const fieldsFragment = document.createDocumentFragment();
      fieldsFragment.appendChild(utils.createLiField("Author", fAuthor));
      fieldsFragment.appendChild(utils.createLiField("Size on (local) system", prettyBytes(selectedNode.size)));
      fieldsFragment.appendChild(utils.createLiField("Homepage", metadata.homepage || "N/A", { isLink: true }));
      fieldsFragment.appendChild(utils.createLiField("npm page", npmHomePageURL, { isLink: true }));
      fieldsFragment.appendChild(utils.createLiField("Last release (version)", metadata.lastVersion));
      fieldsFragment.appendChild(utils.createLiField("Last release (date)", lastUpdate));
      fieldsFragment.appendChild(utils.createLiField("Number of published releases", metadata.publishedCount));
      if (warnings.length > 0) {
        fieldsFragment.appendChild(document.createElement("hr"));
        fieldsFragment.appendChild(utils.createLiField("Warnings", warnings.length, { modal: warningsModal }));
      }
      fieldsFragment.appendChild(utils.createLiField("License", licenses, { modal: licenseModal }));
      clone.querySelector(".fields").appendChild(fieldsFragment);
    }

    {
      const flagsElement = clone.querySelector(".flags");
      const textContent = getFlagsEmojisInlined(flags);
      if (textContent === "") {
        flagsElement.style.display = "none";
      }
      else {
        const flagsFragment = document.createDocumentFragment();
        for (const icon of textContent) {
          if (Reflect.has(secureDataSet.FLAGS, icon)) {
            flagsFragment.appendChild(utils.createTooltip(icon, secureDataSet.FLAGS[icon].tooltipDescription));
          }
        }
        flagsElement.appendChild(flagsFragment);
      }
    }

    {
      utils.createItemsList(clone.getElementById("nodedep"), composition.required_nodejs, (event, coreLib) => {
        window.open(`https://nodejs.org/dist/latest/docs/api/${coreLib}.html`, "_blank").focus();
      });

      // eslint-disable-next-line func-style
      const listener = (event, fileName) => {
        if (fileName === "../" || fileName === "./") {
          return;
        }
        const cleanedFile = fileName.startsWith("./") ? fileName.slice(2) : fileName;
        window.open(`https://unpkg.com/${name}@${version}/${cleanedFile}`, "_blank").focus();
      };
      utils.createItemsList(clone.getElementById("extensions"), composition.extensions);
      utils.createItemsList(clone.getElementById("minifiedfiles"), composition.minified, listener, true);
      utils.createItemsList(clone.getElementById("unuseddep"), composition.unused);
      utils.createItemsList(clone.getElementById("missingdep"), composition.missing, null);

      const graphDepListener = (event, packageName) => {
        nsn.focusNodeByName(packageName);
      }
      utils.createItemsList(clone.getElementById("requireddep"), composition.required_thirdparty, graphDepListener, true);
      utils.createItemsList(clone.getElementById("usedby"), Object.keys(usedBy), graphDepListener, true);
      utils.createItemsList(clone.getElementById("internaldep"), composition.required_files, listener, true);
    }

    showInfoElem.appendChild(clone);

    // Request sizes on the bundlephobia API
    const bundlephobiaResult = await utils.getBundlephobiaSize(name, version);
    if (bundlephobiaResult !== null) {
      document.querySelector(".size-gzip").textContent = bundlephobiaResult.gzip;
      document.querySelector(".size-min").textContent = bundlephobiaResult.size;
      document.querySelector(".size-full").textContent = bundlephobiaResult.fullSize;
    }
  }
});

function toggleModal(templateName, customCallback = null) {
  const infoBox = document.querySelector(".modal-content > .infobox");

  if (typeof templateName === "string") {
    const templateElement = document.getElementById(templateName);
    const clone = templateElement.content.cloneNode(true);
    if (customCallback !== null) {
      customCallback(clone);
    }
    infoBox.appendChild(clone);
  }
  else {
    infoBox.innerHTML = "";
  }
  document.querySelector(".modal").classList.toggle("show");
};
window.toggleModal = toggleModal;
