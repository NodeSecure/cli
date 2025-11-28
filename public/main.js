// Import Third-party Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

// Import Internal Dependencies
import { PackageInfo } from "./components/package/package.js";
import { ViewNavigation } from "./components/navigation/navigation.js";
import { Wiki } from "./components/wiki/wiki.js";
import "./components/popup/popup.js";
import "./components/locker/locker.js";
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
import { WebSocketClient } from "./websocket.js";

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
  window.dispatchEvent(
    new CustomEvent(EVENTS.SETTINGS_SAVED, {
      detail: window.settings.config
    })
  );
  onSettingsSaved(window.settings.config);

  const socket = new WebSocketClient(`ws://${window.location.hostname}:1338`);
  socket.addEventListener("PAYLOAD", onSocketPayload);
  socket.addEventListener("INIT", onSocketInitOrReload);
  socket.addEventListener("RELOAD", onSocketInitOrReload);
  socket.addEventListener("SCAN", (event) => {
    const data = event.detail;

    searchview.onScan(data.spec);
  });
});

async function onSocketPayload(event) {
  const data = event.detail;
  const { payload } = data;

  // TODO: implement rootDependency as a whole spec in scanner
  const rootDepVersion = Object.keys(payload.dependencies[payload.rootDependencyName].versions)[0];
  window.activePackage = payload.rootDependencyName + "@" + rootDepVersion;

  await init({ navigateToNetworkView: true });
  initSearchNav(payload, {
    initFromZero: false,
    searchOptions: {
      nsn,
      secureDataSet
    }
  });
}

async function onSocketInitOrReload(event) {
  const data = event.detail;
  const { cache } = data;

  window.scannedPackageCache = cache.availables;
  window.recentPackageCache = cache.lru;
  console.log(
    "[INFO] Older packages are loaded!",
    window.scannedPackageCache
  );
  console.log(
    "[INFO] Recent packages are loaded!",
    window.recentPackageCache
  );

  initSearchNav(cache, {
    searchOptions: {
      nsn,
      secureDataSet
    }
  });
  searchview.mount();
  searchview.initialize();

  const nsnActivePackage = secureDataSet.linker.get(0);
  const nsnRootPackage = nsnActivePackage ?
    `${nsnActivePackage.name}@${nsnActivePackage.version}` :
    null;
  if (
    data.status === "RELOAD" &&
    nsnRootPackage !== null &&
    nsnRootPackage !== window.activePackage
  ) {
    // it means we removed the previous active package, which is still active in network, so we need to re-init
    await init();

    // FIXME: initSearchNav is called twice, we need to fix this
    initSearchNav(cache, {
      searchOptions: {
        nsn,
        secureDataSet
      }
    });
  }
}

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
  window.locker = document.createElement("nsecure-locker");
  window.locker.nsn = nsn;
  const locker = document.getElementById("network-locker");
  // locker may already have been replaced when reinitializing via the search view
  if (locker) {
    locker.replaceWith(window.locker);
  }
  const legend = document.getElementById("legend");
  legend.isVisible = window.settings.config.showFriendlyDependencies;
  window.legend = legend;
  homeView = new HomeView(secureDataSet, nsn);
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
  const selectedNodeLevel = nsn.getNodeLevel(selectedNode);

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

    if (!nsn) {
      return;
    }

    const { nodes } = secureDataSet.build();
    nsn.nodes.update(nodes.get());
    const rootNode = secureDataSet.linker.get(0);
    window.activePackage = rootNode.name + "@" + rootNode.version;

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

  const networkView = document.getElementById("network--view");

  window.addEventListener(EVENTS.SETTINGS_SAVED, async(event) => {
    updateSettings(event.detail);
  });

  window.addEventListener(EVENTS.LOCKED, () => {
    networkView.classList.add("locked");
  });

  window.addEventListener(EVENTS.UNLOCKED, () => {
    networkView.classList.remove("locked");
  });
}
