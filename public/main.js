// Import Third-party Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import Internal Dependencies
import { PackageInfo } from "./components/package/package.js";
import { ViewNavigation } from "./components/navigation/navigation.js";
import { Wiki } from "./components/wiki/wiki.js";
import "./components/popup/popup.js";
import { Locker } from "./components/locker/locker.js";
import "./components/legend/legend.js";
import "./components/locked-navigation/locked-navigation.js";
import { Settings } from "./components/views/settings/settings.js";
import { HomeView } from "./components/views/home/home.js";
import { SearchView } from "./components/views/search/search.js";
import { NetworkNavigation } from "./core/network-navigation.js";
import { i18n } from "./core/i18n.js";
import { initSearchNav } from "./core/search-nav.js";
import * as utils from "./common/utils.js";
import { EVENTS } from "./core/events.js";

let secureDataSet;
let nsn;
let homeView;
let searchview;
let packageInfoOpened = false;

document.addEventListener("DOMContentLoaded", async() => {
  window.scannedPackageCache = [];
  window.recentPackageCache = [];
  window.locker = null;
  window.settings = await new Settings().fetchUserConfig();
  window.i18n = await new i18n().fetch();
  window.navigation = new ViewNavigation();
  window.wiki = new Wiki();

  await init();
  window.dispatchEvent(new CustomEvent(EVENTS.SETTINGS_SAVED, { detail: window.settings.config }));
  onSettingsSaved(window.settings.config);

  window.socket = new WebSocket(`ws://${window.location.hostname}:1338`);
  window.socket.addEventListener("message", async(event) => {
    const data = JSON.parse(event.data);
    console.log(`[WEBSOCKET] data status = '${data.status || "NONE"}'`);

    if (data.rootDependencyName) {
      window.activePackage = data.rootDependencyName;
      await init({ navigateToNetworkView: true });
      initSearchNav(data, {
        initFromZero: false,
        searchOptions: {
          nsn, secureDataSet
        }
      });
    }
    else if (data.status === "INIT" || data.status === "RELOAD") {
      window.scannedPackageCache = data.availables;
      window.recentPackageCache = data.lru;
      console.log(
        "[INFO] Older packages are loaded!",
        window.scannedPackageCache
      );
      console.log(
        "[INFO] Recent packages are loaded!",
        window.recentPackageCache
      );

      initSearchNav(data, {
        searchOptions: {
          nsn, secureDataSet
        }
      });
      searchview.reset();
      const nsnActivePackage = secureDataSet.linker.get(0);
      const nsnRootPackage = nsnActivePackage ? `${nsnActivePackage.name}@${nsnActivePackage.version}` : null;
      if (data.status === "RELOAD" && nsnRootPackage !== null && nsnRootPackage !== window.activePackage) {
        // it means we removed the previous active package, which is still active in network, so we need to re-init
        await init();

        // FIXME: initSearchNav is called twice, we need to fix this
        initSearchNav(data, {
          searchOptions: {
            nsn, secureDataSet
          }
        });
      }
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

async function init(options = {}) {
  const { navigateToNetworkView = false } = options;

  secureDataSet = new NodeSecureDataSet({
    flagsToIgnore: window.settings.config.ignore.flags,
    warningsToIgnore: window.settings.config.ignore.warnings,
    theme: window.settings.config.theme
  });
  await secureDataSet.init();

  if (secureDataSet.data === null) {
    window.navigation.hideMenu("network--view");
    window.navigation.hideMenu("home--view");
    window.navigation.setNavByName("search--view");

    searchview ??= new SearchView(null, null);

    return;
  }

  window.navigation.showMenu("network--view");
  window.navigation.showMenu("home--view");

  window.vulnerabilityStrategy = secureDataSet.data.vulnerabilityStrategy;

  // Initialize vis Network
  NodeSecureNetwork.networkElementId = "dependency-graph";
  nsn = new NodeSecureNetwork(secureDataSet, {
    i18n: window.i18n[utils.currentLang()],
    theme: window.settings.config.theme
  });
  window.locker = new Locker(nsn);
  const legend = document.getElementById("legend");
  legend.isVisible = window.settings.config.showFriendlyDependencies;
  window.legend = legend;
  homeView ??= new HomeView(secureDataSet, nsn);
  searchview ??= new SearchView(secureDataSet, nsn);

  window.addEventListener(EVENTS.PACKAGE_INFO_CLOSED, () => {
    window.networkNav.currentNodeParams = null;
    packageInfoOpened = false;
  });

  nsn.network.on("click", updateShowInfoMenu);

  const networkNavigation = new NetworkNavigation(secureDataSet, nsn);
  window.networkNav = networkNavigation;

  if (navigateToNetworkView) {
    window.navigation.setNavByName("network--view");
  }

  // update search nav
  const pkgs = document.querySelectorAll("#search-nav .packages > .package");
  for (const pkg of pkgs) {
    if (pkg.dataset.name.startsWith(window.activePackage)) {
      pkg.classList.add("active");
    }
    else {
      pkg.classList.remove("active");
    }
  }

  PackageInfo.close();

  console.log("[INFO] Node-Secure is ready!");
}

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

async function updateShowInfoMenu(params) {
  if (params.nodes.length === 0) {
    window.networkNav.currentNodeParams = null;

    return PackageInfo.close();
  }

  if (window.networkNav.currentNodeParams?.nodes[0] === params.nodes[0] && packageInfoOpened === true) {
    return void 0;
  }

  packageInfoOpened = true;
  window.networkNav.currentNodeParams = params;
  const currentNode = window.networkNav.currentNodeParams.nodes[0];
  const selectedNode = secureDataSet.linker.get(
    Number(currentNode)
  );
  const selectedNodeLevel = getNodeLevel(selectedNode);

  window.networkNav.setLevel(selectedNodeLevel);
  if (window.networkNav.dependenciesMapByLevel.get(selectedNodeLevel) === undefined) {
    window.networkNav.dependenciesMapByLevel.set(selectedNodeLevel, params);
  }

  new PackageInfo(selectedNode, currentNode, secureDataSet.data.dependencies[selectedNode.name], nsn);

  return void 0;
}

function onSettingsSaved(defaultConfig = null) {
  async function updateSettings(config) {
    console.log("[INFO] Settings saved:", config);
    const warningsToIgnore = new Set(config.ignore.warnings);
    const flagsToIgnore = new Set(config.ignore.flags);
    const theme = config.theme;
    secureDataSet.warningsToIgnore = warningsToIgnore;
    secureDataSet.flagsToIgnore = flagsToIgnore;
    secureDataSet.theme = theme;
    window.settings.config.ignore.warnings = warningsToIgnore;
    window.settings.config.ignore.flags = flagsToIgnore;
    window.settings.config.theme = theme;
    window.settings.config.disableExternalRequests = config.disableExternalRequests;

    if (theme === "dark") {
      document.body.classList.add("dark");
    }
    else {
      document.body.classList.remove("dark");
    }

    await secureDataSet.init(
      secureDataSet.data,
      secureDataSet.FLAGS,
      secureDataSet.theme
    );
    const { nodes } = secureDataSet.build();
    nsn.nodes.update(nodes.get());
    const rootNode = secureDataSet.linker.get(0);
    window.activePackage = rootNode.name;

    if (window.networkNav.currentNodeParams !== null) {
      window.navigation.setNavByName("network--view");
      nsn.neighbourHighlight(window.networkNav.currentNodeParams, window.i18n[utils.currentLang()]);
      updateShowInfoMenu(window.networkNav.currentNodeParams);
    }

    if (config.showFriendlyDependencies) {
      window.legend.show();
    }
    else {
      window.legend.hide();
    }

    if (config.disableExternalRequests === false) {
      homeView.generateDownloads();
    }
  }

  if (defaultConfig) {
    updateSettings(defaultConfig);
  }

  window.addEventListener(EVENTS.SETTINGS_SAVED, async(event) => {
    updateSettings(event.detail);
  });
}
