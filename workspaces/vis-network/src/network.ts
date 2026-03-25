// Import Third-party Dependencies
import type { DataSet } from "vis-data";
// @ts-ignore
import { Network, type IdType, type DataInterfaceNodes, type DataInterfaceEdges } from "vis-network/standalone";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.ts";
import * as utils from "./utils.ts";
import type NodeSecureDataSet from "./dataset.ts";
import type {
  LinkerEntry
} from "./dataset.ts";
import type { I18n } from "./constants.ts";
import type { VisEdge, VisNode } from "./types.ts";

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

const kDefaultI18n: I18n = {
  network: {
    childOf: "child of",
    parentOf: "parent of"
  }
};

interface NetworkOptions {
  theme?: string;
  colors?: Partial<(typeof CONSTANTS.COLORS)[keyof typeof CONSTANTS.COLORS]>;
  i18n?: I18n;
}

interface NetworkClickParams {
  nodes: IdType[];
  edges: IdType[];
  // see http://hammerjs.github.io/api/#event-object
  event?: {
    srcEvent?: MouseEvent;
  };
}

type ColorPalette = (typeof CONSTANTS.COLORS)[keyof typeof CONSTANTS.COLORS];

export default class NodeSecureNetwork {
  // DOM Elements
  static networkElementId = "network-graph";
  static networkLoaderElementId = "network-loader";

  secureDataSet: NodeSecureDataSet;
  highlightEnabled: boolean;
  isLoaded: boolean;
  lastHighlightedIds: Set<IdType> | null;
  theme: string;
  colors: ColorPalette;
  nodes: DataSet<VisNode>;
  edges: DataSet<VisEdge>;
  linker: Map<number, LinkerEntry>;
  network: Network;
  i18n: I18n;

  constructor(
    secureDataSet: NodeSecureDataSet,
    options: NetworkOptions = {}
  ) {
    console.log("[Network] created");
    const networkElement = document.getElementById(NodeSecureNetwork.networkElementId)!;
    networkElement.click();

    this.secureDataSet = secureDataSet;
    this.highlightEnabled = false;
    this.isLoaded = false;

    this.lastHighlightedIds = null;
    const networkLoaderElement = document.getElementById(NodeSecureNetwork.networkLoaderElementId)!;
    networkLoaderElement.classList.remove("hidden");
    const { nodes, edges } = secureDataSet.build();

    const theme = options.theme?.toUpperCase() ?? "LIGHT";

    if (!(theme in CONSTANTS.COLORS)) {
      throw new Error(`Unknown theme ${options.theme}. Theme value can be LIGHT or DARK`);
    }

    this.theme = theme;
    this.colors = {
      ...CONSTANTS.COLORS[theme as keyof typeof CONSTANTS.COLORS],
      ...(options.colors ?? {})
    };

    this.nodes = nodes;
    this.edges = edges;
    this.linker = secureDataSet.linker;
    this.network = new Network(
      networkElement,
      {
        nodes: nodes as unknown as DataInterfaceNodes,
        edges: edges as unknown as DataInterfaceEdges
      },
      NETWORK_OPTIONS
    );
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
      this.network.on("click", (params: NetworkClickParams) => {
        const srcEvent = params.event?.srcEvent;
        if (srcEvent?.ctrlKey || srcEvent?.metaKey) {
          return;
        }

        this.neighbourHighlight(params);
      });
      this.network.setOptions({ physics: false });
    });

    this.network.stabilize(500);
  }

  * findNodeIds(
    packages: Set<string>
  ): IterableIterator<number> {
    for (const [id, opt] of this.linker) {
      const spec = `${opt.name}@${opt.version}`;

      if (packages.has(opt.name) || packages.has(spec)) {
        yield id;
      }
    }
  }

  focusNodeById(
    id = 0
  ): void {
    this.network.emit("click", { nodes: [id] });
  }

  focusNodeByName(
    packageName: string
  ): boolean {
    let wantedId: number | null = null;
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

  focusNodeByNameAndVersion(
    packageName: string,
    version: string
  ): boolean {
    if (!version || !version.trim()) {
      return this.focusNodeByName(packageName);
    }

    let wantedId: number | null = null;
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

  highlightNodeNeighbour(
    node: number,
    hidden = false
  ): void {
    this.network.startSimulation();

    const updatedNodes = [...this.searchForNeighbourIds(node)]
      .map((id) => {
        return { id, hidden };
      });

    this.nodes.update(updatedNodes);
  }

  highlightMultipleNodes(
    nodeIds: number[]
  ): void {
    if (this.lastHighlightedIds !== null) {
      this.resetHighlight();
    }
    this.network.startSimulation();

    const allNodes = this.nodes.get({ returnType: "Object" });
    const allEdges = this.edges.get();

    // mark all nodes as hard to read.
    const nodeIdsToHighlight = new Set(nodeIds);
    for (const node of Object.values(allNodes)) {
      const color = nodeIdsToHighlight.has(Number(node.id)) ?
        this.colors.SELECTED_GROUP :
        this.colors.HARDTOREAD;

      Object.assign(node, color);

      const entry = this.linker.get(Number(node.id));
      if (entry?.isHighlighted) {
        node.shadow = { enabled: false };
        node.borderWidth = 1;
      }
    }

    for (const nodeId of nodeIdsToHighlight) {
      const connectedNodes = this.network.getConnectedNodes(nodeId) as IdType[];
      const allConnectedNodes: IdType[] = [];
      for (let i = 0; i < connectedNodes.length; i++) {
        allConnectedNodes.push(...this.network.getConnectedNodes(connectedNodes[i]) as IdType[]);
      }

      // all second degree nodes get a different color and their label back
      for (let i = 0; i < allConnectedNodes.length; i++) {
        const node = allNodes[allConnectedNodes[i]];
        if (nodeIdsToHighlight.has(Number(node.id))) {
          continue;
        }

        Object.assign(node, this.colors.DEFAULT);
      }
    }

    // reset all edge labels - even if user clicks on empty space
    for (let i = 0; i < allEdges.length; i++) {
      Object.assign(allEdges[i], {
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

  resetHighlight(): void {
    const allNodes = this.nodes.get();
    const allEdges = this.edges.get();

    // reset all edge labels - even if user clicks on empty space
    for (let i = 0; i < allEdges.length; i++) {
      Object.assign(allEdges[i], CONSTANTS.LABELS.NONE);
    }

    this.highlightEnabled = false;
    for (const node of allNodes) {
      const { id, hasWarnings, isFriendly, isHighlighted } = this.linker.get(Number(node.id))!;

      Object.assign(node, utils.getNodeColor({ id, hasWarnings, theme: this.theme, isFriendly, isHighlighted }));
    }

    this.lastHighlightedIds = null;
    this.network.startSimulation();
    this.nodes.update(allNodes);
    this.edges.update(allEdges);
    this.network.stopSimulation();
  }

  getNodeLevel(
    node: LinkerEntry
  ): number {
    const rootNode = this.secureDataSet.linker.get(0)!;
    if (node.id === rootNode.id) {
      return 0;
    }

    let level = 1;
    let currentNode = node;
    while (currentNode.usedBy[rootNode.name] === undefined) {
      currentNode = this.secureDataSet.linker.get(
        [...this.secureDataSet.linker].find(([_, { name }]) => Object.keys(currentNode.usedBy)[0] === name)![0]
      )!;
      level++;
    }

    return level;
  }

  /**
   * Search for neighbours nodes of a given node
   *
   * @generator
   * @yields The next neighbour node
   */
  * searchForNeighbourIds(
    selectedNode: number
  ): Generator<number> {
    const { name, version } = this.linker.get(Number(selectedNode))!;

    for (const descriptor of Object.values(this.secureDataSet.data!.dependencies)) {
      for (const { id, usedBy } of Object.values(descriptor.versions)) {
        if (Reflect.has(usedBy, name) && usedBy[name] === version) {
          yield* this.searchForNeighbourIds(id);
          yield id;
        }
      }
    }
  }

  /**
   * Returns the selected color for a node, preserving highlighted border+shadow if applicable.
   * @param {number} nodeId
   * @param {"SELECTED" | "SELECTED_LOCK"} colorKey
   */
  #selectedColor(nodeId, colorKey) {
    const entry = this.linker.get(Number(nodeId));
    const base = this.colors[colorKey];

    if (!entry?.isHighlighted) {
      return base;
    }

    const borderColor = CONSTANTS.COLORS[this.theme].HIGHLIGHTED.border;

    return {
      color: {
        background: base.color,
        border: borderColor
      },
      font: base.font,
      borderWidth: 2,
      shadow: {
        enabled: true,
        color: borderColor,
        size: 12,
        x: 0,
        y: 0
      }
    };
  }

  lockedNeighbourHighlight(
    params: NetworkClickParams | undefined
  ): boolean {
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
        this.#selectedColor(node.id, "SELECTED_LOCK") :
        this.colors.SELECTED_GROUP;

      Object.assign(node, color);
    }

    // get the second degree nodes
    const connectedNodes = this.network.getConnectedNodes(selectedNode) as IdType[];
    const allConnectedNodes: IdType[] = [];
    for (let i = 0; i < connectedNodes.length; i++) {
      allConnectedNodes.push(...this.network.getConnectedNodes(connectedNodes[i]) as IdType[]);
    }

    // all second degree nodes get a different color and their label back
    for (let i = 0; i < allConnectedNodes.length; i++) {
      const node = allNodes[allConnectedNodes[i]];
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

  neighbourHighlight(
    params: NetworkClickParams | undefined,
    i18n: I18n = this.i18n
  ): void {
    if (this.lockedNeighbourHighlight(params)) {
      console.log("[NETWORK] locked, stop neighbour highlight");

      return;
    }
    console.log("[NETWORK] neighbour highlight start");

    const allNodes = this.nodes.get({ returnType: "Object" });
    const allEdges = this.edges.get();

    // reset all edge labels - even if user clicks on empty space
    for (let i = 0; i < allEdges.length; i++) {
      Object.assign(allEdges[i], CONSTANTS.LABELS.NONE);
    }

    // if something is selected:
    if (params && params.nodes.length > 0) {
      this.highlightEnabled = true;
      const selectedNode = params.nodes[0];

      // mark all nodes as hard to read.
      for (const node of Object.values(allNodes)) {
        Object.assign(node, this.colors.HARDTOREAD);

        const entry = this.linker.get(Number(node.id));

        if (entry?.isHighlighted) {
          node.shadow = { enabled: false };
          node.borderWidth = 1;
        }
      }

      // get the second degree nodes
      const connectedNodes = this.network.getConnectedNodes(selectedNode) as IdType[];
      const allConnectedNodes: IdType[] = [];
      for (let i = 0; i < connectedNodes.length; i++) {
        allConnectedNodes.push(...this.network.getConnectedNodes(connectedNodes[i]) as IdType[]);
      }

      // all second degree nodes get a different color and their label back
      for (let i = 0; i < allConnectedNodes.length; i++) {
        Object.assign(allNodes[allConnectedNodes[i]], this.colors.DEFAULT);
      }

      // all first degree nodes get their own color and their label back
      for (let i = 0; i < connectedNodes.length; i++) {
        const isNodeConnectedIn = allEdges.some((edge) => edge.from === selectedNode && edge.to === connectedNodes[i]);
        const color = this.colors[isNodeConnectedIn ? "CONNECTED_IN" : "CONNECTED_OUT"];

        Object.assign(allNodes[connectedNodes[i]], color);
      }

      // the main node gets its own color and its label back.
      Object.assign(allNodes[selectedNode], this.#selectedColor(selectedNode, "SELECTED"));

      // select and label edges connected to the selected node
      const connectedEdges = this.network.getConnectedEdges(selectedNode);
      this.network.selectEdges(connectedEdges);
      for (let i = 0; i < connectedEdges.length; i++) {
        const edgeIndex = allEdges.findIndex((edge) => edge.id === connectedEdges[i]);
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
        const { id, hasWarnings, isFriendly, isHighlighted } = this.linker.get(Number(node.id))!;

        Object.assign(node, utils.getNodeColor({ id, hasWarnings, theme: this.theme, isFriendly, isHighlighted }));
      }
    }

    this.lastHighlightedIds = null;
    this.nodes.update(Object.values(allNodes));
    this.edges.update(allEdges);
    this.network.stopSimulation();

    this.network.emit("highlight_done");
  }
}
