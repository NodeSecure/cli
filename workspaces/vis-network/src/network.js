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
    width: 2
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

export default class NodeSecureNetwork {
  // DOM Elements
  static networkElementId = "network-graph";
  static networkLoaderElementId = "network-loader";

  /**
   * @param {!NodeSecureDataSet} secureDataSet
   * @param {object} [options]
   * @param {"LIGHT" | "DARK"} [options.theme="LIGHT"]
   * @param {*} [options.colors]
   */
  constructor(secureDataSet, options = {}) {
    console.log("[Network] created");
    const networkElement = document.getElementById(NodeSecureNetwork.networkElementId);
    networkElement.click();

    this.secureDataSet = secureDataSet;
    this.highlightEnabled = false;
    this.isLoaded = false;
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

    this.network.on("stabilizationIterationsDone", () => {
      if (this.isLoaded) {
        this.network.focus(0, { animation: true, scale: 0.35 });

        return;
      }
      console.log("[NETWORK] stabilizationIterationsDone triggered");
      const networkLoaderElement = document.getElementById(NodeSecureNetwork.networkLoaderElementId);
      networkLoaderElement.style.display = "none";

      this.isLoaded = true;
      this.network.stopSimulation();
      this.network.on("click", this.neighbourHighlight.bind(this));
    });

    this.network.stabilize(500);
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

  /**
   * Search for neighbours nodes of a given node
   *
   * @generator
   * @param {number} selectedNode
   * @yields {number} The next neighbour node
   */
  * searchForNeighbourIds(selectedNode) {
    const { name, version } = this.linker.get(selectedNode);

    for (const descriptor of Object.values(this.secureDataSet.data.dependencies)) {
      for (const { id, usedBy } of Object.values(descriptor.versions)) {
        if (Reflect.has(usedBy, name) && usedBy[name] === version) {
          yield* this.searchForNeighbourIds(id);
          yield id;
        }
      }
    }
  }

  neighbourHighlight(params) {
    const allNodes = this.nodes.get({ returnType: "Object" });
    const allEdges = this.edges.get();

    // if something is selected:
    if (params.nodes.length > 0) {
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

      this.network.focus(selectedNode, { animation: true, scale: 0.35 });
    }
    else if (this.highlightEnabled) {
      this.highlightEnabled = false;
      for (const node of Object.values(allNodes)) {
        const { id, hasWarnings } = this.linker.get(Number(node.id));

        Object.assign(node, utils.getNodeColor(id, hasWarnings, this.theme));
      }
    }

    // transform the object into an array
    this.nodes.update(Object.values(allNodes));
    this.network.stopSimulation();
  }
}
