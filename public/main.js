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
import "./components/search-command/search-command.js";
import { Settings } from "./components/views/settings/settings.js";
import { HomeView } from "./components/views/home/home.js";
import "./components/views/search/search.js";
import "./components/views/warnings/warnings.js";
import "./components/root-selector/root-selector.js";
import "./components/network-breadcrumb/network-breadcrumb.js";
import { NetworkNavigation } from "./core/network-navigation.js";
import { i18n } from "./core/i18n.js";
import * as utils from "./common/utils.js";
import { EVENTS } from "./core/events.js";
import { WebSocketClient } from "./websocket.js";

// CONSTANTS
const kSearchShortcut = navigator.userAgent.includes("Mac") ? "⌘K" : "Ctrl+K";

let secureDataSet;
let nsn;
let homeView;
let searchview;
let warningsView;
let viewAfterSwitch = null;
let drillBreadcrumb;
let packageInfoOpened = false;
const drillStack = [];

document.addEventListener("DOMContentLoaded", async() => {
  searchview = document.querySelector("search-view");
  warningsView = document.querySelector("warnings-view");

  window.cachedSpecs = [];
  window.locker = null;
  window.settings = await new Settings().fetchUserConfig();
  window.i18n = await new i18n().fetch();
  window.navigation = new ViewNavigation();
  window.wiki = new Wiki();

  // update searchview after window.i18n is set
  searchview.requestUpdate();

  const isNetworkViewActive = document.getElementById("network--view").classList.contains("hidden") === false;
  const searchShortcutHint = utils.createDOMElement("div", {
    classList: isNetworkViewActive ? ["search-shortcut-hint"] : ["search-shortcut-hint", "hidden"],
    attributes: { id: "search-shortcut-hint" },
    childs: [
      utils.createDOMElement("kbd", { text: kSearchShortcut })
    ]
  });
  document.body.appendChild(searchShortcutHint);

  window.addEventListener(EVENTS.NETWORK_VIEW_HID, () => {
    searchShortcutHint.classList.add("hidden");
  });
  window.addEventListener(EVENTS.NETWORK_VIEW_SHOWED, () => {
    if (!document.getElementById("network--view").classList.contains("hidden")) {
      searchShortcutHint.classList.remove("hidden");
    }
  });

  drillBreadcrumb = document.querySelector("network-breadcrumb");
  drillBreadcrumb.addEventListener(EVENTS.DRILL_RESET, resetDrill);
  drillBreadcrumb.addEventListener(EVENTS.DRILL_BACK, function handleDrillBack(event) {
    drillBackTo(event.detail.index);
  });
  drillBreadcrumb.addEventListener(EVENTS.DRILL_SWITCH, function handleDrillSwitch(event) {
    const { stackIndex, nodeId } = event.detail;
    drillStack.length = stackIndex;
    drillInto(nodeId);
  });
  drillBreadcrumb.addEventListener(EVENTS.ROOT_SWITCH, function handleRootSwitch(event) {
    window.socket.commands.search(event.detail.spec);
  });

  window.addEventListener(EVENTS.ROOT_SWITCH, function handleGlobalRootSwitch(event) {
    viewAfterSwitch = window.navigation.activeMenu?.getAttribute("data-menu") ?? null;
    window.socket.commands.search(event.detail.spec);
  });
  drillBreadcrumb.addEventListener(EVENTS.ROOT_REMOVE, function handleRootRemove() {
    const specToRemove = window.activePackage;
    const nextPackage = drillBreadcrumb.packages[0];
    if (nextPackage) {
      window.socket.commands.search(nextPackage.spec);
    }
    else {
      window.navigation.hideMenu("network--view");
      window.navigation.hideMenu("home--view");
      window.navigation.hideMenu("warnings--view");
      window.navigation.setNavByName("search--view");
    }
    window.socket.commands.remove(specToRemove);
  });

  warningsView.addEventListener("click", (event) => {
    const clickedRow = event.composedPath().find(
      (el) => el instanceof Element && el.classList.contains("pkg-row")
    );
    if (!clickedRow) {
      PackageInfo.close();
    }
  });

  window.addEventListener(EVENTS.WARNINGS_PACKAGE_CLICK, (event) => {
    const { nodeId } = event.detail;
    const node = secureDataSet.linker.get(nodeId);
    if (!node) {
      return;
    }

    window.navigation.setNavByName("network--view");
    setTimeout(() => {
      PackageInfo.ForcedPackageMenu = "warnings";
      nsn.focusNodeByNameAndVersion(node.name, node.version);
    }, 25);
  });

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
  socket.addEventListener("ERROR", (event) => {
    const data = event.detail;

    searchview.onScanError(data.error);
  });
});

async function onSocketPayload(event) {
  const data = event.detail;
  const { payload } = data;

  const { name, version } = payload.rootDependency;
  window.activePackage = name + "@" + version;

  const targetView = viewAfterSwitch;
  viewAfterSwitch = null;

  await init({ navigateToNetworkView: targetView === null });

  if (targetView !== null && targetView !== "network--view") {
    window.navigation.setNavByName(targetView);
  }

  dispatchSearchCommandInit();
}

async function onSocketInitOrReload(event) {
  const data = event.detail;
  const { cache } = data;

  window.cachedSpecs = cache;
  console.log(
    "[INFO] Cached specs are loaded!",
    window.cachedSpecs
  );

  const nsnActivePackage = secureDataSet?.linker.get(0);
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
  }

  drillBreadcrumb.packages = cache.filter((pkg) => pkg.spec !== window.activePackage);
  searchview.cachedSpecs = cache;
  searchview.reset();

  if (data.status === "RELOAD" && cache.length === 0) {
    window.navigation.hideMenu("network--view");
    window.navigation.hideMenu("home--view");
    window.navigation.hideMenu("warnings--view");
    window.navigation.setNavByName("search--view");
  }

  dispatchSearchCommandInit();
}

function dispatchSearchCommandInit() {
  if (!nsn || !secureDataSet) {
    return;
  }

  const event = new CustomEvent(EVENTS.SEARCH_COMMAND_INIT, {
    detail: {
      network: nsn,
      linker: secureDataSet.linker,
      packages: secureDataSet.packages
    }
  });
  window.dispatchEvent(event);
}

function computeSiblings(parentId, excludeId) {
  const seen = new Set();
  const result = [];

  for (const edge of secureDataSet.rawEdgesData) {
    if (edge.to === parentId && edge.from !== excludeId && !seen.has(edge.from)) {
      seen.add(edge.from);

      const entry = secureDataSet.linker.get(edge.from);
      result.push({
        nodeId: edge.from,
        name: entry.name,
        version: entry.version
      });
    }
  }

  return result.sort((nodeA, nodeB) => nodeA.name.localeCompare(nodeB.name));
}

function computeDrillSubtree(rootNodeId) {
  const subtreeIds = new Set([rootNodeId]);
  const queue = [rootNodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of secureDataSet.rawEdgesData) {
      if (edge.to === current && !subtreeIds.has(edge.from)) {
        subtreeIds.add(edge.from);
        queue.push(edge.from);
      }
    }
  }

  return subtreeIds;
}

function applyDrill(nodeId) {
  const subtreeIds = computeDrillSubtree(nodeId);
  const updates = [...secureDataSet.linker.keys()].map((id) => {
    return {
      id,
      hidden: !subtreeIds.has(id)
    };
  });
  nsn.nodes.update(updates);
  nsn.network.unselectAll();
  updateDrillBreadcrumb();
  PackageInfo.close();
  nsn.neighbourHighlight({ nodes: [nodeId], edges: [] });
}

function drillInto(nodeId) {
  const currentRoot = drillStack.length === 0 ? 0 : drillStack.at(-1);
  if (nodeId === currentRoot) {
    return;
  }

  drillStack.push(nodeId);
  applyDrill(nodeId);
}

function drillBackTo(stackIndex) {
  drillStack.length = stackIndex + 1;
  applyDrill(drillStack[stackIndex]);
}

function resetDrill() {
  drillStack.length = 0;
  const updates = [...secureDataSet.linker.keys()].map((id) => {
    return {
      id,
      hidden: false
    };
  });
  nsn.nodes.update(updates);
  updateDrillBreadcrumb();
  PackageInfo.close();
}

function updateDrillBreadcrumb() {
  const rootEntry = secureDataSet.linker.get(0);
  drillBreadcrumb.root = {
    name: rootEntry.name,
    version: rootEntry.version
  };
  drillBreadcrumb.packages = window.cachedSpecs.filter(
    (pkg) => pkg.spec !== window.activePackage
  );
  drillBreadcrumb.stack = drillStack.map((nodeId) => {
    const entry = secureDataSet.linker.get(nodeId);

    return {
      name: entry.name,
      version: entry.version
    };
  });
  drillBreadcrumb.siblings = drillStack.map((nodeId, index) => {
    const parentId = index === 0 ? 0 : drillStack[index - 1];

    return computeSiblings(parentId, nodeId);
  });
}

async function init(options = {}) {
  const { navigateToNetworkView = false } = options;

  const datasetLoaded = await loadDataSet();
  if (!datasetLoaded) {
    return;
  }

  window.navigation.showMenu("network--view");
  window.navigation.showMenu("home--view");
  window.navigation.showMenu("warnings--view");
  warningsView.secureDataSet = secureDataSet;

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

  window.addEventListener(EVENTS.PACKAGE_INFO_CLOSED, () => {
    window.networkNav.currentNodeParams = null;
    packageInfoOpened = false;
  });

  nsn.network.on("click", (params) => {
    const srcEvent = params.event?.srcEvent;
    const isDrillClick = srcEvent?.ctrlKey || srcEvent?.metaKey;

    if (isDrillClick && params.nodes.length > 0) {
      const nodeId = Number(params.nodes[0]);
      drillInto(nodeId);

      return;
    }

    updateShowInfoMenu(params);
  });

  drillStack.length = 0;
  updateDrillBreadcrumb();

  const networkNavigation = new NetworkNavigation(secureDataSet, nsn);
  window.networkNav = networkNavigation;

  if (navigateToNetworkView) {
    window.navigation.setNavByName("network--view");
  }

  PackageInfo.close();

  console.log("[INFO] Node-Secure is ready!");
}

async function loadDataSet() {
  const config = window.settings.config;

  secureDataSet = new NodeSecureDataSet({
    flagsToIgnore: config.ignore.flags,
    warningsToIgnore: config.ignore.warnings,
    theme: config.theme
  });
  await secureDataSet.init();

  if (secureDataSet.data === null) {
    window.navigation.hideMenu("network--view");
    window.navigation.hideMenu("home--view");
    window.navigation.hideMenu("warnings--view");
    window.navigation.setNavByName("search--view");

    return false;
  }

  return true;
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

    document.body.classList.toggle("dark", theme === "dark");

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

new EventSource("/esbuild").addEventListener("change", () => location.reload());

