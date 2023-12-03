// Import Third-party Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import UI Components
import { PackageInfo } from "./components/package/package.js";
import { ViewNavigation } from "./components/navigation/navigation.js";
import { Wiki } from "./components/wiki/wiki.js";
import { SearchBar } from "./components/searchbar/searchbar.js";
import { Popup } from "./components/popup/popup.js";

// Import Views Components
import { Settings } from "./components/views/settings/settings.js";
import { HomeView } from "./components/views/home/home.js";
import { NetworkNavigation } from "./core/network-navigation.js";

document.addEventListener("DOMContentLoaded", async() => {
  window.popup = new Popup();
  window.settings = await new Settings().fetchUserConfig();
  window.navigation = new ViewNavigation();
  window.wiki = new Wiki();
  let packageInfoOpened = false;
  const secureDataSet = new NodeSecureDataSet({
    flagsToIgnore: window.settings.config.ignore.flags,
    warningsToIgnore: window.settings.config.ignore.warnings
  });
  await secureDataSet.init();

  window.vulnerabilityStrategy = secureDataSet.data.vulnerabilityStrategy;

  // Initialize vis Network
  NodeSecureNetwork.networkElementId = "dependency-graph";
  const nsn = new NodeSecureNetwork(secureDataSet);
  new HomeView(secureDataSet, nsn);

  window.addEventListener("package-info-closed", () => {
    currentNodeParams = null;
    packageInfoOpened = false;
  });

  nsn.network.on("click", updateShowInfoMenu);

  function getNodeLevel(node) {
    const rootNode = secureDataSet.linker.get(0);
    if (node.id === rootNode.id) {
      return 0;
    }

    let level = 1;
    let currentNode = node;
    while (currentNode.usedBy[rootNode.name] === undefined) {
      currentNode = secureDataSet.linker.get(
        [...secureDataSet.linker].find(([_, { name }]) => Object.keys(currentNode.usedBy)[0] === name)[0]
      );
      level++;
    }

    return level;
  }

  const networkNavigation = new NetworkNavigation(secureDataSet, nsn);

  window.addEventListener("settings-saved", async(event) => {
    const warningsToIgnore = new Set(event.detail.ignore.warnings);
    const flagsToIgnore = new Set(event.detail.ignore.flags);
    secureDataSet.warningsToIgnore = warningsToIgnore;
    secureDataSet.flagsToIgnore = flagsToIgnore;
    window.settings.config.ignore.warnings = warningsToIgnore;
    window.settings.config.ignore.flags = flagsToIgnore;

    await secureDataSet.init(
      secureDataSet.data,
      secureDataSet.FLAGS
    );
    const { nodes } = secureDataSet.build();
    nsn.nodes.update(nodes.get());

    if (networkNavigation.currentNodeParams !== null) {
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
      networkNavigation.currentNodeParams = null;

      return PackageInfo.close();
    }

    if (networkNavigation.currentNodeParams?.nodes[0] === params.nodes[0] && packageInfoOpened === true) {
      return void 0;
    }

    packageInfoOpened = true;
    networkNavigation.currentNodeParams = params;
    const currentNode = networkNavigation.currentNodeParams.nodes[0];
    const selectedNode = secureDataSet.linker.get(
      Number(currentNode)
    );
    const selectedNodeLevel = getNodeLevel(selectedNode);

    networkNavigation.setLevel(selectedNodeLevel);
    if (networkNavigation.dependenciesMapByLevel.get(selectedNodeLevel) === undefined) {
      networkNavigation.dependenciesMapByLevel.set(selectedNodeLevel, params);
    }

    new PackageInfo(selectedNode, currentNode, secureDataSet.data.dependencies[selectedNode.name], nsn);

    return void 0;
  }
});
