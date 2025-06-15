// Import Third-party Dependencies
import { Network } from "vis-network/standalone/esm/index.js";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.js";
import * as utils from "./utils.js";

// CONSTANTS
export const NETWORK_OPTIONS = {
  nodes: {
    mass: 6,
    shape: "box",
    size: 5,
    font: {
      face: "Roboto",
      vadjust: 2,
      size: 40
    },
    margin: 20,
    shadow: {
      enabled: true,
      color: "rgba(20, 20, 20, 0.1)"
    }
  },
  edges: {
    arrows: "from",
    hoverWidth: 3,
    selectionWidth: 3,
    width: 2,
    font: {
      align: "middle",
      face: "Roboto",
      size: 40
    }
  },
  physics: {
    forceAtlas2Based: {
      gravitationalConstant: -35,
      centralGravity: 0.002,
      springLength: 200,
      springConstant: 0.17,
      avoidOverlap: 0.8
    },
    maxVelocity: 150,
    solver: "forceAtlas2Based",
    timestep: 0.35,
    stabilization: {
      enabled: true
    }
  }
};
const kDefaultI18n = {
  network: {
    childOf: "child of",
    parentOf: "parent of"
  }
};

export default class NodeSecureNetwork {
  // DOM Elements
  static networkElementId = "network-graph";
  static networkLoaderElementId = "network-loader";

  /**
   * @param {!NodeSecureDataSet} secureDataSet
   * @param {object} [options]
   * @param {"LIGHT" | "DARK"} [options.theme="LIGHT"]
   * @param {*} [options.colors]
   * @param {*} [options.i18n]
   */
  constructor(secureDataSet, options = {}) {
    console.log("[Network] created");
    const networkElement = document.getElementById(NodeSecureNetwork.networkElementId);
    networkElement.click();

    this.secureDataSet = secureDataSet;
    this.highlightEnabled = false;
    this.isLoaded = false;

    this.lastHighlightedIds = null;
    const networkLoaderElement = document.getElementById(NodeSecureNetwork.networkLoaderElementId);
    networkLoaderElement.classList.remove("hidden");
    const { nodes, edges } = secureDataSet.build();

    const theme = options.theme?.toUpperCase() ?? "LIGHT";

    if (!(theme in CONSTANTS.COLORS)) {
      throw new Error(`Unknown theme ${options.theme}. Theme value can be LIGHT or DARK`);
    }

    this.theme = theme;
    this.colors = { ...CONSTANTS.COLORS[this.theme], ...(options.colors ?? {}) };

    this.nodes = nodes;
    this.edges = edges;
    this.linker = secureDataSet.linker;
    this.network = new Network(networkElement, { nodes, edges }, NETWORK_OPTIONS);
    this.i18n = options.i18n ?? kDefaultI18n;

    this.network.on("stabilizationIterationsDone", () => {
      if (this.isLoaded) {
        this.network.focus(0, { animation: true, scale: 0.35 });

        return;
      }
      console.log("[NETWORK] stabilizationIterationsDone triggered");
      networkLoaderElement.classList.add("hidden");

      this.isLoaded = true;
      this.network.stopSimulation();
      this.network.on("click", this.neighbourHighlight.bind(this));
      this.network.setOptions({ physics: false });
    });

    this.network.stabilize(500);
  }

  /**
   * @param {!Set<string>} packages
   * @returns {IterableIterator<number>}
   */
  * findNodeIds(packages) {
    for (const [id, opt] of this.linker) {
      const spec = `${opt.name}@${opt.version}`;

      if (packages.has(opt.name) || packages.has(spec)) {
        yield id;
      }
    }
  }

  /**
   * @description Focus/move to a Node by id
   * @param {number} [id=0]
   */
  focusNodeById(id = 0) {
    this.network.emit("click", { nodes: [id] });
  }

  /**
   * @description Focus/move to a Node by package name
   * @param {!string} packageName
   * @returns {boolean}
   */
  focusNodeByName(packageName) {
    let wantedId = null;
    for (const [id, opt] of this.linker) {
      if (opt.name === packageName) {
        wantedId = id;
        break;
      }
    }

    if (wantedId !== null) {
      this.focusNodeById(wantedId);

      return true;
    }

    return false;
  }

  /**
   * @description Focus/move to a Node by package name and version
   * @param {!string} packageName
   * @param {!string} version
   * @returns {boolean}
   */
  focusNodeByNameAndVersion(packageName, version) {
    if (!version || !version.trim()) {
      return this.focusNodeByName(packageName);
    }

    let wantedId = null;
    for (const [id, opt] of this.linker) {
      if (opt.name === packageName && opt.version === version) {
        wantedId = id;
        break;
      }
    }

    if (wantedId !== null) {
      this.focusNodeById(wantedId);

      return true;
    }

    return false;
  }

  /**
   * @param {!number} node
   * @param {boolean} hidden
   */
  highlightNodeNeighbour(node, hidden = false) {
    this.network.startSimulation();

    const updatedNodes = [...this.searchForNeighbourIds(node)]
      .map((id) => {
        return { id, hidden };
      });

    this.nodes.update(updatedNodes);
  }

  highlightMultipleNodes(nodeIds) {
    if (this.lastHighlightedIds !== null) {
      this.resetHighlight();
    }
    this.network.startSimulation();

    const allNodes = this.nodes.get({ returnType: "Object" });
    const allEdges = this.edges.get();

    // mark all nodes as hard to read.
    const nodeIdsToHighlight = new Set(nodeIds);
    for (const node of Object.values(allNodes)) {
      const color = nodeIdsToHighlight.has(node.id) ?
        this.colors.SELECTED_GROUP :
        this.colors.HARDTOREAD;

      Object.assign(node, color);
    }

    for (const nodeId of nodeIdsToHighlight) {
      const connectedNodes = this.network.getConnectedNodes(nodeId);
      const allConnectedNodes = [];
      for (let id = 0; id < connectedNodes.length; id++) {
        allConnectedNodes.push(...this.network.getConnectedNodes(connectedNodes[id]));
      }

      // all second degree nodes get a different color and their label back
      for (let id = 0; id < allConnectedNodes.length; id++) {
        const node = allNodes[allConnectedNodes[id]];
        if (nodeIdsToHighlight.has(node.id)) {
          continue;
        }

        Object.assign(node, this.colors.DEFAULT);
      }
    }

    // reset all edge labels - even if user clicks on empty space
    for (let id = 0; id < allEdges.length; id++) {
      Object.assign(allEdges[id], {
        label: " ",
        font: {
          background: "Transparent"
        }
      });
    }

    this.lastHighlightedIds = nodeIdsToHighlight;
    this.nodes.update(Object.values(allNodes));
    this.edges.update(allEdges);
    this.network.stopSimulation();
  }

  resetHighlight() {
    const allNodes = this.nodes.get();
    const allEdges = this.edges.get();

    // reset all edge labels - even if user clicks on empty space
    for (let id = 0; id < allEdges.length; id++) {
      Object.assign(allEdges[id], CONSTANTS.LABELS.NONE);
    }

    this.highlightEnabled = false;
    for (const node of allNodes) {
      const { id, hasWarnings, isFriendly } = this.linker.get(Number(node.id));

      Object.assign(node, utils.getNodeColor({ id, hasWarnings, theme: this.theme, isFriendly }));
    }

    this.lastHighlightedIds = null;
    this.network.startSimulation();
    this.nodes.update(allNodes);
    this.edges.update(allEdges);
    this.network.stopSimulation();
  }

  /**
   * Search for neighbours nodes of a given node
   *
   * @generator
   * @param {number} selectedNode
   * @yields {number} The next neighbour node
   */
  * searchForNeighbourIds(selectedNode) {
    const { name, version } = this.linker.get(Number(selectedNode));

    for (const descriptor of Object.values(this.secureDataSet.data.dependencies)) {
      for (const { id, usedBy } of Object.values(descriptor.versions)) {
        if (Reflect.has(usedBy, name) && usedBy[name] === version) {
          yield* this.searchForNeighbourIds(id);
          yield id;
        }
      }
    }
  }

  lockedNeighbourHighlight(params) {
    if (this.lastHighlightedIds === null) {
      return false;
    }

    if (!params || params.nodes.length === 0) {
      return true;
    }

    const selectedNode = params.nodes[0];
    if (!this.lastHighlightedIds.has(selectedNode)) {
      return false;
    }

    const allNodes = this.nodes.get({ returnType: "Object" });
    for (const node of Object.values(allNodes)) {
      if (!this.lastHighlightedIds.has(node.id)) {
        continue;
      }

      const color = node.id === selectedNode ?
        this.colors.SELECTED_LOCK :
        this.colors.SELECTED_GROUP;

      Object.assign(node, color);
    }

    // get the second degree nodes
    const connectedNodes = this.network.getConnectedNodes(selectedNode);
    const allConnectedNodes = [];
    for (let id = 0; id < connectedNodes.length; id++) {
      allConnectedNodes.push(...this.network.getConnectedNodes(connectedNodes[id]));
    }

    // all second degree nodes get a different color and their label back
    for (let id = 0; id < allConnectedNodes.length; id++) {
      const node = allNodes[allConnectedNodes[id]];
      if (this.lastHighlightedIds.has(node.id)) {
        continue;
      }

      Object.assign(node, this.colors.DEFAULT);
    }

    this.network.startSimulation();
    this.nodes.update(Object.values(allNodes));
    this.network.focus(selectedNode, {
      animation: true,
      scale: 0.35,
      offset: { x: 150, y: 0 }
    });
    this.network.stopSimulation();

    return true;
  }

  neighbourHighlight(params, i18n = this.i18n) {
    if (this.lockedNeighbourHighlight(params)) {
      console.log("[NETWORK] locked, stop neighbour highlight");

      return;
    }
    console.log("[NETWORK] neighbour highlight start");

    const allNodes = this.nodes.get({ returnType: "Object" });
    const allEdges = this.edges.get();

    // reset all edge labels - even if user clicks on empty space
    for (let id = 0; id < allEdges.length; id++) {
      Object.assign(allEdges[id], CONSTANTS.LABELS.NONE);
    }

    // if something is selected:
    if (params && params.nodes.length > 0) {
      this.highlightEnabled = true;
      const selectedNode = params.nodes[0];

      // mark all nodes as hard to read.
      for (const node of Object.values(allNodes)) {
        Object.assign(node, this.colors.HARDTOREAD);
      }

      // get the second degree nodes
      const connectedNodes = this.network.getConnectedNodes(selectedNode);
      const allConnectedNodes = [];
      for (let id = 0; id < connectedNodes.length; id++) {
        allConnectedNodes.push(...this.network.getConnectedNodes(connectedNodes[id]));
      }

      // all second degree nodes get a different color and their label back
      for (let id = 0; id < allConnectedNodes.length; id++) {
        Object.assign(allNodes[allConnectedNodes[id]], this.colors.DEFAULT);
      }

      // all first degree nodes get their own color and their label back
      for (let id = 0; id < connectedNodes.length; id++) {
        const isNodeConnectedIn = allEdges.some((edge) => edge.from === selectedNode && edge.to === connectedNodes[id]);
        const color = this.colors[isNodeConnectedIn ? "CONNECTED_IN" : "CONNECTED_OUT"];

        Object.assign(allNodes[connectedNodes[id]], color);
      }

      // the main node gets its own color and its label back.
      Object.assign(allNodes[selectedNode], this.colors.SELECTED);

      // select and label edges connected to the selected node
      const connectedEdges = this.network.getConnectedEdges(selectedNode);
      this.network.selectEdges(connectedEdges);
      for (let id = 0; id < connectedEdges.length; id++) {
        const edgeIndex = allEdges.findIndex((edge) => edge.id === connectedEdges[id]);
        // the arrow on the edge is set to point into the 'from' node
        if (allEdges[edgeIndex].from === selectedNode) {
          Object.assign(allEdges[edgeIndex], CONSTANTS.LABELS.INCOMING(i18n));
        }
        else if (allEdges[edgeIndex].to === selectedNode) {
          Object.assign(allEdges[edgeIndex], CONSTANTS.LABELS.OUTGOING(i18n));
        }
      }

      this.network.focus(selectedNode, {
        animation: true,
        scale: 0.35,
        offset: { x: 150, y: 0 }
      });
    }
    else if (this.highlightEnabled) {
      this.highlightEnabled = false;
      for (const node of Object.values(allNodes)) {
        const { id, hasWarnings, isFriendly } = this.linker.get(Number(node.id));

        Object.assign(node, utils.getNodeColor({ id, hasWarnings, theme: this.theme, isFriendly }));
      }
    }

    this.lastHighlightedIds = null;
    this.nodes.update(Object.values(allNodes));
    this.edges.update(allEdges);
    this.network.stopSimulation();

    this.network.emit("highlight_done");
  }
}
