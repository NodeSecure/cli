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
import "./components/command-palette/command-palette.js";
import "./components/views/settings/settings.js";
import { HomeView } from "./components/views/home/home.js";
import "./components/views/search/search.js";
import "./components/views/tree/tree.js";
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

/** @type {NodeSecureDataSet | undefined} */
let secureDataSet;
/** @type {NodeSecureNetwork | undefined} */
let nsn;
/** @type {HomeView | undefined} */
let homeView;
/** @type {import("./components/views/search/search.js").SearchView | undefined} */
let searchview;
/** @type {import("./components/views/tree/tree.js").TreeView | undefined} */
let treeView;
/** @type {import("./components/views/warnings/warnings.js").WarningsView | undefined} */
let warningsView;
/** @type {string | null} */
let viewAfterSwitch = null;
/** @type {import("./components/network-breadcrumb/network-breadcrumb.js").NetworkBreadcrumb | undefined} */
let drillBreadcrumb;
let packageInfoOpened = false;
/** @type {number[]} */
const drillStack = [];

/**
 * @typedef {Object} SocketPayloadDetail
 * @property {{ rootDependency: { name: string, version: string } }} payload
 */

/**
 * @typedef {Object} SocketInitDetail
 * @property {import("./types.js").CachedSpec[]} cache
 * @property {string} status
 */

document.addEventListener("DOMContentLoaded", async() => {
  searchview = /** @type {import("./components/views/search/search.js").SearchView} */ (document.querySelector("search-view"));
  treeView = /** @type {import("./components/views/tree/tree.js").TreeView} */ (document.querySelector("tree-view"));
  warningsView = /** @type {import("./components/views/warnings/warnings.js").WarningsView} */ (
    document.querySelector("warnings-view")
  );

  window.cachedSpecs = [];
  window.locker = null;
  window.i18n = await new i18n().fetch();
  const settingsView = /** @type {import("./components/views/settings/settings.js").SettingsView} */ (
    document.querySelector("settings-view")
  );
  window.settings = /** @type {any} */ (settingsView);
  await settingsView.fetchUserConfig();
  window.navigation = /** @type {any} */ (new ViewNavigation());
  window.wiki = new Wiki();

  // update searchview after window.i18n is set
  searchview.requestUpdate();

  const networkView = /** @type {HTMLElement} */ (document.getElementById("network--view"));
  const isNetworkViewActive = networkView.classList.contains("hidden") === false;
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
    if (!networkView.classList.contains("hidden")) {
      searchShortcutHint.classList.remove("hidden");
    }
  });

  drillBreadcrumb = /** @type {import("./components/network-breadcrumb/network-breadcrumb.js").NetworkBreadcrumb} */ (
    document.querySelector("network-breadcrumb")
  );
  drillBreadcrumb.addEventListener(EVENTS.DRILL_RESET, resetDrill);
  drillBreadcrumb.addEventListener(EVENTS.DRILL_BACK, function handleDrillBack(/** @type {Event} */ event) {
    drillBackTo(/** @type {CustomEvent<{ index: number }>} */ (event).detail.index);
  });
  drillBreadcrumb.addEventListener(EVENTS.DRILL_SWITCH, function handleDrillSwitch(/** @type {Event} */ event) {
    const { stackIndex, nodeId } = /** @type {CustomEvent<{ stackIndex: number, nodeId: number }>} */ (event).detail;
    drillStack.length = stackIndex;
    drillInto(nodeId);
  });
  drillBreadcrumb.addEventListener(EVENTS.ROOT_SWITCH, function handleRootSwitch(/** @type {Event} */ event) {
    window.socket.commands.search(/** @type {CustomEvent<{ spec: string }>} */ (event).detail.spec);
  });

  window.addEventListener(EVENTS.ROOT_SWITCH, function handleGlobalRootSwitch(/** @type {Event} */ event) {
    viewAfterSwitch = utils.getNavigation().activeMenu?.getAttribute("data-menu") ?? null;
    window.socket.commands.search(/** @type {CustomEvent<{ spec: string }>} */ (event).detail.spec);
  });
  drillBreadcrumb.addEventListener(EVENTS.ROOT_REMOVE, function handleRootRemove() {
    const specToRemove = window.activePackage;
    const nextPackage = /** @type {import("./components/network-breadcrumb/network-breadcrumb.js").NetworkBreadcrumb} */ (
      drillBreadcrumb
    ).packages[0];
    if (nextPackage) {
      window.socket.commands.search(nextPackage.spec);
    }
    else {
      utils.getNavigation().hideMenu("network--view");
      utils.getNavigation().hideMenu("home--view");
      utils.getNavigation().hideMenu("tree--view");
      utils.getNavigation().hideMenu("warnings--view");
      utils.getNavigation().setNavByName("search--view");
    }
    window.socket.commands.remove(specToRemove);
  });

  treeView.addEventListener("click", (event) => {
    const clickedCard = event.composedPath().find(
      (el) => el instanceof Element && el.classList.contains("tree-card")
    );
    if (!clickedCard) {
      PackageInfo.close();
    }
  });

  warningsView.addEventListener("click", (event) => {
    const clickedRow = event.composedPath().find(
      (el) => el instanceof Element && el.classList.contains("pkg-row")
    );
    if (!clickedRow) {
      PackageInfo.close();
    }
  });

  window.addEventListener(EVENTS.WARNINGS_PACKAGE_CLICK, (/** @type {Event} */ event) => {
    const { nodeId } = /** @type {CustomEvent<{ nodeId: number }>} */ (event).detail;
    const node = secureDataSet?.linker.get(nodeId);
    if (!node) {
      return;
    }

    utils.getNavigation().setNavByName("network--view");
    setTimeout(() => {
      PackageInfo.ForcedPackageMenu = "warnings";
      nsn?.focusNodeByNameAndVersion(node.name, node.version);
    }, 25);
  });

  window.addEventListener(EVENTS.TREE_NODE_CLICK, (/** @type {Event} */ event) => {
    console.log(event);
    if (!secureDataSet) {
      return;
    }

    const { nodeId } = /** @type {CustomEvent<{ nodeId: number }>} */ (event).detail;
    const selectedNode = secureDataSet.linker.get(nodeId);
    if (!selectedNode || !secureDataSet.data) {
      return;
    }

    new PackageInfo(selectedNode, nodeId, secureDataSet.data.dependencies[selectedNode.name], nsn);
  });

  await init();
  window.dispatchEvent(
    new CustomEvent(EVENTS.SETTINGS_SAVED, {
      detail: utils.getSettingsConfig()
    })
  );
  onSettingsSaved(utils.getSettingsConfig());

  const socket = new WebSocketClient(`ws://${window.location.hostname}:${window.__WS_PORT__}`);
  socket.addEventListener("PAYLOAD", onSocketPayload);
  socket.addEventListener("INIT", onSocketInitOrReload);
  socket.addEventListener("RELOAD", onSocketInitOrReload);
  socket.addEventListener("SCAN", (/** @type {Event} */ event) => {
    const data = /** @type {CustomEvent<{ spec: string }>} */ (event).detail;

    searchview?.onScan(data.spec);
  });
  socket.addEventListener("ERROR", (/** @type {Event} */ event) => {
    const data = /** @type {CustomEvent<{ error: string }>} */ (event).detail;

    searchview?.onScanError(data.error);
  });
});

/**
 * @param {Event} event
 */
async function onSocketPayload(event) {
  const data = /** @type {CustomEvent<SocketPayloadDetail>} */ (event).detail;
  const { payload } = data;

  const { name, version } = payload.rootDependency;
  window.activePackage = name + "@" + version;

  const targetView = viewAfterSwitch;
  viewAfterSwitch = null;

  await init({ navigateToNetworkView: targetView === null });

  if (targetView !== null && targetView !== "network--view") {
    utils.getNavigation().setNavByName(targetView);
  }

  dispatchCommandPaletteInit();
}

/**
 * @param {Event} event
 */
async function onSocketInitOrReload(event) {
  const data = /** @type {CustomEvent<SocketInitDetail>} */ (event).detail;
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

  if (drillBreadcrumb) {
    drillBreadcrumb.packages = cache.filter((pkg) => pkg.spec !== window.activePackage);
  }
  if (searchview) {
    searchview.cachedSpecs = cache;
    searchview.reset();
  }

  if (cache.length === 0) {
    utils.getNavigation().hideMenu("network--view");
    utils.getNavigation().hideMenu("home--view");
    utils.getNavigation().hideMenu("tree--view");
    utils.getNavigation().hideMenu("warnings--view");
    utils.getNavigation().setNavByName("search--view");
  }

  dispatchCommandPaletteInit();
}

function dispatchCommandPaletteInit() {
  if (!nsn || !secureDataSet) {
    return;
  }

  const event = new CustomEvent(EVENTS.COMMAND_PALETTE_INIT, {
    detail: {
      network: nsn,
      linker: secureDataSet.linker,
      packages: secureDataSet.packages
    }
  });
  window.dispatchEvent(event);
}

/**
 * @param {number} parentId
 * @param {number} excludeId
 */
function computeSiblings(parentId, excludeId) {
  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  /** @type {Set<number>} */
  const seen = new Set();
  /** @type {{ nodeId: number, name: string, version: string }[]} */
  const result = [];

  for (const edge of ds.rawEdgesData) {
    if (edge.to === parentId && edge.from !== excludeId && !seen.has(edge.from)) {
      seen.add(edge.from);

      const entry = ds.linker.get(edge.from);
      if (entry) {
        result.push({
          nodeId: edge.from,
          name: entry.name,
          version: entry.version
        });
      }
    }
  }

  return result.sort((nodeA, nodeB) => nodeA.name.localeCompare(nodeB.name));
}

/**
 * @param {number} rootNodeId
 */
function computeDrillSubtree(rootNodeId) {
  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  const subtreeIds = new Set([rootNodeId]);
  const queue = [rootNodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const edge of ds.rawEdgesData) {
      if (edge.to === current && !subtreeIds.has(edge.from)) {
        subtreeIds.add(edge.from);
        queue.push(edge.from);
      }
    }
  }

  return subtreeIds;
}

/**
 * @param {number} nodeId
 */
function applyDrill(nodeId) {
  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  const network = /** @type {NodeSecureNetwork} */ (nsn);
  const subtreeIds = computeDrillSubtree(nodeId);
  const updates = [...ds.linker.keys()].map((id) => {
    return {
      id,
      hidden: !subtreeIds.has(id)
    };
  });
  network.nodes.update(updates);
  network.network.unselectAll();
  updateDrillBreadcrumb();
  PackageInfo.close();
  network.neighbourHighlight({ nodes: [nodeId], edges: [] });
}

/**
 * @param {number} nodeId
 */
function drillInto(nodeId) {
  const currentRoot = drillStack.length === 0 ? 0 : drillStack.at(-1);
  if (nodeId === currentRoot) {
    return;
  }

  drillStack.push(nodeId);
  applyDrill(nodeId);
}

/**
 * @param {number} stackIndex
 */
function drillBackTo(stackIndex) {
  drillStack.length = stackIndex + 1;
  applyDrill(drillStack[stackIndex]);
}

function resetDrill() {
  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  const network = /** @type {NodeSecureNetwork} */ (nsn);
  drillStack.length = 0;
  const updates = [...ds.linker.keys()].map((id) => {
    return {
      id,
      hidden: false
    };
  });
  network.nodes.update(updates);
  updateDrillBreadcrumb();
  PackageInfo.close();
}

function updateDrillBreadcrumb() {
  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  const breadcrumb = /** @type {import("./components/network-breadcrumb/network-breadcrumb.js").NetworkBreadcrumb} */ (
    drillBreadcrumb
  );
  const rootEntry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (ds.linker.get(0));
  breadcrumb.root = {
    name: rootEntry.name,
    version: rootEntry.version
  };
  breadcrumb.packages = window.cachedSpecs.filter(
    (pkg) => pkg.spec !== window.activePackage
  );
  breadcrumb.stack = drillStack.map((nodeId) => {
    const entry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (ds.linker.get(nodeId));

    return {
      name: entry.name,
      version: entry.version
    };
  });
  breadcrumb.siblings = drillStack.map((nodeId, index) => {
    const parentId = index === 0 ? 0 : drillStack[index - 1];

    return computeSiblings(parentId, nodeId);
  });
}

/**
 * @param {{ navigateToNetworkView?: boolean }} options
 */
async function init(options = {}) {
  const { navigateToNetworkView = false } = options;

  const datasetLoaded = await loadDataSet();
  if (!datasetLoaded) {
    return;
  }

  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  const dsData = /** @type {NonNullable<NodeSecureDataSet["data"]>} */ (ds.data);

  utils.getNavigation().showMenu("network--view");
  utils.getNavigation().showMenu("home--view");
  utils.getNavigation().showMenu("tree--view");
  utils.getNavigation().showMenu("warnings--view");
  if (treeView) {
    treeView.secureDataSet = ds;
  }
  if (warningsView) {
    warningsView.secureDataSet = ds;
  }

  window.vulnerabilityStrategy = dsData.vulnerabilityStrategy;

  // Initialize vis Network
  NodeSecureNetwork.networkElementId = "dependency-graph";
  nsn = new NodeSecureNetwork(ds, {
    i18n: /** @type {any} */ (window.i18n[utils.currentLang()]),
    theme: utils.getSettingsConfig().theme
  });
  const lockerElement = document.createElement("nsecure-locker");
  lockerElement.nsn = nsn;
  window.locker = lockerElement;
  const locker = document.getElementById("network-locker");
  // locker may already have been replaced when reinitializing via the search view
  if (locker) {
    locker.replaceWith(lockerElement);
  }
  const legend = /** @type {HTMLElement & { isVisible: boolean, show(): void, hide(): void }} */ (
    document.getElementById("legend")
  );
  legend.isVisible = utils.getSettingsConfig().showFriendlyDependencies;
  window.legend = legend;
  homeView = new HomeView(ds, nsn);

  window.addEventListener(EVENTS.PACKAGE_INFO_CLOSED, () => {
    if (window.networkNav) {
      window.networkNav.currentNodeParams = null;
    }
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

  const networkNavigation = new NetworkNavigation(ds, nsn);
  window.networkNav = networkNavigation;

  if (navigateToNetworkView) {
    utils.getNavigation().setNavByName("network--view");
  }

  PackageInfo.close();

  console.log("[INFO] Node-Secure is ready!");
}

async function loadDataSet() {
  const config = utils.getSettingsConfig();

  secureDataSet = new NodeSecureDataSet({
    flagsToIgnore: /** @type {string[]} */ (/** @type {unknown} */ (config.ignore.flags)),
    warningsToIgnore: /** @type {string[]} */ (/** @type {unknown} */ (config.ignore.warnings)),
    theme: config.theme
  });
  await secureDataSet.init();

  if (secureDataSet.data === null) {
    utils.getNavigation().hideMenu("network--view");
    utils.getNavigation().hideMenu("home--view");
    utils.getNavigation().hideMenu("tree--view");
    utils.getNavigation().hideMenu("warnings--view");
    utils.getNavigation().setNavByName("search--view");

    return false;
  }

  return true;
}

/**
 * @param {any} params
 */
async function updateShowInfoMenu(params) {
  const networkNav = /** @type {NetworkNavigation} */ (window.networkNav);
  const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
  const dsData = /** @type {NonNullable<NodeSecureDataSet["data"]>} */ (ds.data);
  const network = /** @type {NodeSecureNetwork} */ (nsn);

  if (params.nodes.length === 0) {
    networkNav.currentNodeParams = null;

    return PackageInfo.close();
  }

  if (networkNav.currentNodeParams?.nodes[0] === params.nodes[0] && packageInfoOpened === true) {
    return void 0;
  }

  packageInfoOpened = true;
  networkNav.currentNodeParams = params;
  const currentNode = /** @type {import("./core/network-navigation.js").LevelParams} */ (networkNav.currentNodeParams).nodes[0];
  const selectedNode = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (ds.linker.get(
    Number(currentNode)
  ));
  const selectedNodeLevel = network.getNodeLevel(selectedNode);

  networkNav.setLevel(selectedNodeLevel);
  if (networkNav.dependenciesMapByLevel.get(selectedNodeLevel) === undefined) {
    networkNav.dependenciesMapByLevel.set(selectedNodeLevel, params);
  }

  new PackageInfo(selectedNode, currentNode, dsData.dependencies[selectedNode.name], network);

  return void 0;
}

/**
 * @param {import("./types.js").AppConfig | null} defaultConfig
 */
function onSettingsSaved(defaultConfig = null) {
  /**
   * @param {import("./types.js").AppConfig} config
   */
  async function updateSettings(config) {
    console.log("[INFO] Settings saved:", config);
    const warningsToIgnore = new Set(config.ignore.warnings);
    const flagsToIgnore = new Set(config.ignore.flags);
    const theme = config.theme;
    const ds = /** @type {NodeSecureDataSet} */ (secureDataSet);
    ds.warningsToIgnore = warningsToIgnore;
    ds.flagsToIgnore = flagsToIgnore;
    ds.theme = theme;
    const settingsConfig = utils.getSettingsConfig();
    settingsConfig.ignore.warnings = warningsToIgnore;
    settingsConfig.ignore.flags = flagsToIgnore;
    settingsConfig.theme = theme;
    settingsConfig.disableExternalRequests = config.disableExternalRequests;

    document.body.classList.toggle("dark", theme === "dark");

    await ds.init(ds.data, ds.FLAGS);

    if (!nsn) {
      return;
    }

    const { nodes } = ds.build();
    nsn.nodes.update(nodes.get());
    const rootNode = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (ds.linker.get(0));
    window.activePackage = rootNode.name + "@" + rootNode.version;

    if (window.networkNav && window.networkNav.currentNodeParams !== null) {
      utils.getNavigation().setNavByName("network--view");
      nsn.neighbourHighlight(
        /** @type {any} */ (window.networkNav.currentNodeParams),
        /** @type {any} */ (window.i18n[utils.currentLang()])
      );
      updateShowInfoMenu(window.networkNav.currentNodeParams);
    }

    if (config.showFriendlyDependencies) {
      window.legend.show();
    }
    else {
      window.legend.hide();
    }

    if (config.disableExternalRequests === false) {
      homeView?.generateDownloads();
    }

    warningsView?.requestUpdate();
    treeView?.requestUpdate();
  }

  if (defaultConfig) {
    updateSettings(defaultConfig);
  }

  const networkView = /** @type {HTMLElement} */ (document.getElementById("network--view"));

  window.addEventListener(EVENTS.SETTINGS_SAVED, async(/** @type {Event} */ event) => {
    updateSettings(/** @type {CustomEvent<import("./types.js").AppConfig>} */ (event).detail);
  });

  window.addEventListener(EVENTS.LOCKED, () => {
    networkView.classList.add("locked");
  });

  window.addEventListener(EVENTS.UNLOCKED, () => {
    networkView.classList.remove("locked");
  });
}

new EventSource("/esbuild").addEventListener("change", () => location.reload());

