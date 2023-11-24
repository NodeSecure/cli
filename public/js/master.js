"use strict";

// Import Third-party Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import UI Components
import { ViewNavigation } from "./components/navigation.js";
import { PackageInfo } from "./components/package/package.js";
import { Wiki } from "./components/wiki.js";
import { SearchBar } from "./components/searchbar.js";
import { Settings } from "./components/settings.js";
import { HomeView } from "./components/home.js";

document.addEventListener("DOMContentLoaded", async () => {
  window.settings = await new Settings().fetchUserConfig();
  window.navigation = new ViewNavigation();
  window.wiki = new Wiki();
  let currentNodeParams = null;

  const secureDataSet = new NodeSecureDataSet({
    flagsToIgnore: window.settings.config.ignore.flags,
    warningsToIgnore: window.settings.config.ignore.warnings
  });
  await secureDataSet.init();

  new HomeView(secureDataSet);
  window.vulnerabilityStrategy = secureDataSet.data.vulnerabilityStrategy;

  // Initialize vis Network
  NodeSecureNetwork.networkElementId = "dependency-graph";
  const nsn = new NodeSecureNetwork(secureDataSet);
  nsn.network.on("click", updateShowInfoMenu);

  window.addEventListener("settings-saved", async(event) => {
    secureDataSet.warningsToIgnore = new Set(event.detail.ignore.warnings);
    secureDataSet.flagsToIgnore = new Set(event.detail.ignore.flags);

    await secureDataSet.init(secureDataSet.data);
    const { nodes } = secureDataSet.build();
    nsn.nodes.update(nodes.get());

    if (currentNodeParams) {
      window.navigation.setNavByName("network--view");
      nsn.neighbourHighlight(currentNodeParams);
      updateShowInfoMenu(currentNodeParams);
    }
  });

  // Initialize searchbar
  {
    const dataListElement = document.getElementById("package-list");
    for (const info of secureDataSet.packages) {
      const content = `<p>${info.flags} ${info.name}</p><b>${info.version}</b>`;
      dataListElement.insertAdjacentHTML("beforeend", `<div class="package hide" data-value="${info.id}">${content}</div>`);
    }
  }
  window.searchbar = new SearchBar(nsn, secureDataSet.linker);

  async function updateShowInfoMenu(params) {
    if (params.nodes.length === 0) {
      currentNodeParams = null;

      return PackageInfo.close();
    }

    currentNodeParams = params;
    const currentNode = currentNodeParams.nodes[0];
    const selectedNode = secureDataSet.linker.get(
      Number(currentNode)
    );
    new PackageInfo(selectedNode, currentNode, secureDataSet.data.dependencies[selectedNode.name], nsn);
  }
});
