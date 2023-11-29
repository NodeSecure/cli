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
  let currentNodeParams;
  let packageInfoOpened = false;
  const levelNodesParams = new Map();
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
  const rootNodeParams = {
    nodes: [0],
    edges: nsn.network.getConnectedEdges(0)
  };
  levelNodesParams.set(0, rootNodeParams);

  window.addEventListener("package-info-closed", () => {
    currentNodeParams = null;
    packageInfoOpened = false;
  })

  nsn.network.on("click", updateShowInfoMenu);

  window.addEventListener("settings-saved", async (event) => {
    const warningsToIgnore = new Set(event.detail.ignore.warnings);
    const flagsToIgnore = new Set(event.detail.ignore.flags);
    secureDataSet.warningsToIgnore = warningsToIgnore;
    secureDataSet.flagsToIgnore = flagsToIgnore;
    window.settings.config.ignore.warnings = warningsToIgnore;
    window.settings.config.ignore.flags = flagsToIgnore;

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

    if (currentNodeParams?.nodes[0] === params.nodes[0] && packageInfoOpened === true) {
      return;
    }

    packageInfoOpened = true;
    currentNodeParams = params;
    const currentNode = currentNodeParams.nodes[0];
    const selectedNode = secureDataSet.linker.get(
      Number(currentNode)
    );
    new PackageInfo(selectedNode, currentNode, secureDataSet.data.dependencies[selectedNode.name], nsn);
  }

  // Defines level of dependency. 0 is the root node, 1 is the first level of dependency, etc.
  let level = 0;
  document.addEventListener("keydown", (event) => {
    const nodeParam = currentNodeParams ?? rootNodeParams;
    const nodeDependencyName = secureDataSet.linker.get(nodeParam.nodes[0]).name;
    const usedBy = [...secureDataSet.linker].filter(([id, opt]) => Object.keys(secureDataSet.linker.get(nodeParam.nodes[0]).usedBy).includes(opt.name));
    const use = [...secureDataSet.linker].filter(([id, opt]) => Reflect.has(opt.usedBy, nodeDependencyName));

    switch (event.code) {
      case "ArrowLeft":
        {
          if (level === 0) {
            break;
          }

          const previousNodeDependencyName = secureDataSet.linker.get(levelNodesParams.get(level === 0 ? 0 : level - 1).nodes[0]).name;
          const useByPrevious = [...secureDataSet.linker].filter(([id, opt]) =>
            Reflect.has(opt.usedBy, previousNodeDependencyName) &&
            opt.id !== nodeParam.nodes[0] &&
            opt.id !== levelNodesParams.get(level - 1).nodes[0]
          );
          if (useByPrevious.length <= 1) {
            break;
          }

          useByPrevious.sort(([aId], [bId]) => bId - aId)
          const activeNode = (useByPrevious.find(([id]) => id < nodeParam.nodes[0]) ?? useByPrevious[0])[0];
          nsn.focusNodeById(activeNode);

          currentNodeParams = {
            nodes: [activeNode],
            edges: nsn.network.getConnectedEdges(activeNode)
          };
          levelNodesParams.set(level, nodeParam);
        }
        break;
      case "ArrowRight":
        {
          if (level === 0) {
            break;
          }

          const previousNodeDependencyName = secureDataSet.linker.get(levelNodesParams.get(level === 0 ? 0 : level - 1).nodes[0]).name;
          const useByPrevious = [...secureDataSet.linker].filter(([id, opt]) =>
            Reflect.has(opt.usedBy, previousNodeDependencyName) &&
            opt.id !== nodeParam.nodes[0] &&
            opt.id !== levelNodesParams.get(level - 1).nodes[0]
          );
          if (useByPrevious.length <= 1) {
            break;
          }

          useByPrevious.sort(([aId], [bId]) => aId - bId);
          const activeNode = (useByPrevious.find(([id]) => { console.log(id); return id > nodeParam.nodes[0] }) ?? useByPrevious[0])[0];
          nsn.focusNodeById(activeNode);

          currentNodeParams = {
            nodes: [activeNode],
            edges: nsn.network.getConnectedEdges(activeNode)
          };
          levelNodesParams.set(level, nodeParam);
        }
        break;
      case "ArrowUp":
        if (use.length === 0) {
          break;
        }

        function setNextLevel(node) {
          const activeNode = node[0];
          currentNodeParams = {
            nodes: [activeNode],
            edges: nsn.network.getConnectedEdges(activeNode)
          };
          nsn.focusNodeById(activeNode);
          level++;
          levelNodesParams.set(level, nodeParam);
        }

        const nextLevelNodeMatchingUseDependencies = use.find(([id]) => id === levelNodesParams.get(level + 1)?.nodes[0]);
        if (nextLevelNodeMatchingUseDependencies) {
          setNextLevel(nextLevelNodeMatchingUseDependencies);
        }
        else {
          setNextLevel(use[0]);
        }

        break;
      case "ArrowDown":
        if (level === 0) {
          break;
        }

        function setPreviousLevel(node) {
          const activeNode = node[0];
          currentNodeParams = {
            nodes: [activeNode],
            edges: nsn.network.getConnectedEdges(activeNode)
          };
          nsn.focusNodeById(activeNode);
          level--;
          levelNodesParams.set(level, nodeParam);
        }

        const previousLevelNodeMatchingUsedByDependencies = usedBy.find(([id]) => id === levelNodesParams.get(level - 1)?.nodes[0]);
        if (previousLevelNodeMatchingUsedByDependencies) {
          setPreviousLevel(previousLevelNodeMatchingUsedByDependencies);
        }
        else {
          setPreviousLevel(usedBy[0]);
        }

        break;
      default:
        break;
    }
  });
});
