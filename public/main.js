// Import Third-party Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import UI Components
import { PackageInfo } from "./components/package/package.js";
import { ViewNavigation } from "./components/navigation/navigation.js";
import { Wiki } from "./components/wiki/wiki.js";
import { Popup } from "./components/popup/popup.js";
import { Locker } from "./components/locker/locker.js";
import { Legend } from "./components/legend/legend.js";

// Import Views Components
import { Settings } from "./components/views/settings/settings.js";
import { HomeView } from "./components/views/home/home.js";
import { SearchView } from "./components/views/search/search.js";

// Import Core Components
import { NetworkNavigation } from "./core/network-navigation.js";
import { i18n } from "./core/i18n.js";
import { initSearchNav } from "./core/search-nav.js";

// Import Utils
import * as utils from "./common/utils.js";

let secureDataSet;
let nsn;
let searchview;

document.addEventListener("DOMContentLoaded", async() => {
  window.scannedPackageCache = [];
  window.locker = null;
  window.popup = new Popup();
  window.settings = await new Settings().fetchUserConfig();
  window.i18n = await new i18n().fetch();
  window.navigation = new ViewNavigation();
  window.wiki = new Wiki();

  await init();

  window.socket = new WebSocket(`ws://${window.location.hostname}:1338`);
  window.socket.addEventListener("message", async(event) => {
    const data = JSON.parse(event.data);
    if (data.rootDependencyName) {
      window.activePackage = data.rootDependencyName;
      await init({ navigateToNetworkView: true });
    }
    else if (data.status === "INIT" || data.status === "RELOAD") {
      window.scannedPackageCache = data.older;
      console.log(
        "[INFO] Older packages are loaded!",
        window.scannedPackageCache
      );
      initSearchNav(data, nsn, secureDataSet);
      searchview.reset();
    }
    else if (data.status === "SCAN") {
      searchview.onScan(data.pkg);
    }
  });

  window.onbeforeunload = () => {
    window.socket.onclose = () => void 0;
    window.socket.close();
  };
});

async function init(options = { navigateToNetworkView: false }) {
  let packageInfoOpened = false;
  secureDataSet = new NodeSecureDataSet({
    flagsToIgnore: window.settings.config.ignore.flags,
    warningsToIgnore: window.settings.config.ignore.warnings
  });
  await secureDataSet.init();

  window.vulnerabilityStrategy = secureDataSet.data.vulnerabilityStrategy;

  // Initialize vis Network
  NodeSecureNetwork.networkElementId = "dependency-graph";
  nsn = new NodeSecureNetwork(secureDataSet, { i18n: window.i18n[utils.currentLang()] });
  window.locker = new Locker(nsn);
  const legend = new Legend({ show: window.settings.config.showFriendlyDependencies });
  new HomeView(secureDataSet, nsn);
  searchview ??= new SearchView(secureDataSet, nsn);

  window.addEventListener("package-info-closed", () => {
    networkNavigation.currentNodeParams = null;
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
  window.networkNav = networkNavigation;

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
    const rootNode = secureDataSet.linker.get(0);
    window.activePackage = rootNode.name;

    if (networkNavigation.currentNodeParams !== null) {
      window.navigation.setNavByName("network--view");
      nsn.neighbourHighlight(networkNavigation.currentNodeParams, window.i18n[utils.currentLang()]);
      updateShowInfoMenu(networkNavigation.currentNodeParams);
    }

    if (event.detail.showFriendlyDependencies) {
      legend.show();
    }
    else {
      legend.hide();
    }
  });

  if (options.navigateToNetworkView) {
    window.navigation.setNavByName("network--view");
  }

  // update search nav
  const searchNavElement = document.getElementById("search-nav");
  const pkgs = searchNavElement.querySelectorAll(".package");
  for (const pkg of pkgs) {
    if (pkg.textContent.startsWith(window.activePackage)) {
      pkg.classList.add("active");
    }
    else {
      pkg.classList.remove("active");
    }
  }

  console.log("[INFO] Node-Secure is ready!");

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
}
