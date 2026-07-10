// Import Internal Dependencies
import { PackageInfo } from "../components/package/package.js";
import { EVENTS } from "./events.js";

/**
 * @typedef {Object} NavNode
 * @property {number} id
 * @property {string} name
 * @property {Record<string, string>} usedBy
 * @property {import("vis-network/standalone").Position} position
 */

/**
 * @typedef {Object} LevelParams
 * @property {number[]} nodes
 * @property {import("vis-network/standalone").IdType[]} [edges]
 */

export class NetworkNavigation {
  /**
   * @type {import("@nodesecure/vis-network").NodeSecureDataSet}
   */
  #secureDataSet;
  /**
   * @type {import("@nodesecure/vis-network").NodeSecureNetwork}
   */
  #nsn;
  /**
   * Represents the selected node for each level.
   *
   * When the user navigate to a new level, the previous level is stored in this Map.
   * It is used to navigate back to the previous dependency when navigating to the previous level.
   *
   * @type {Map<number, LevelParams>}
   */
  #dependenciesMapByLevel = new Map();
  /**
   * Represents the current level of the tree.
   */
  #currentLevel = 0;
  /**
   * Represents the current dependency index for the current level.
   */
  #currentLevelDependenciesIndex = 0;
  /**
   * Represents all nodes of the graph.
   *
   * @type {[number, NavNode][]}
   */
  #nodes;
  /**
   * Represents the current node params.
   *
   * @type {LevelParams | null | undefined}
   */
  #currentNodeParams;
  /**
   * Represents the current node.
   *
   * @type {[number, NavNode] | undefined}
   */
  #currentNode;
  /**
   * Represents the current node dependencies.
   *
   * @type {[number, NavNode][] | undefined}
   */
  #currentNodeUsedBy;
  /**
   * Represents the dependencies that depends on the current node.
   *
   * @type {[number, NavNode][] | undefined}
   */
  #usedByCurrentNode;
  /**
   * Represents the locked nodes.
   *
   * @type {[number, import("@nodesecure/vis-network").LinkerEntry & { position: import("vis-network/standalone").Position }][]}
   */
  #lockedNodes = [];
  /**
   * Represents the active locked node index.
   */
  #lockedNodesActiveIndex = 0;
  /**
   * -`true` package info navigation\
   * -`false` network navigation
   */
  #packageInfoFocus = false;

  set currentNodeParams(params) {
    this.#currentNodeParams = params;
  }

  get currentNodeParams() {
    return this.#currentNodeParams;
  }

  get dependenciesMapByLevel() {
    return this.#dependenciesMapByLevel;
  }

  get rootNodeParams() {
    return {
      nodes: [0],
      edges: this.#nsn.network.getConnectedEdges(0)
    };
  }

  /**
   * @param {import("vis-network/standalone").Position} position1
   * @param {import("vis-network/standalone").Position} position2
   */
  calculateAngle(position1, position2) {
    const dx = position2.x - position1.x;
    const dy = position2.y - position1.y;

    return Math.atan2(dy, dx);
  }

  /**
   * @param {number} level
   */
  setLevel(level) {
    this.#currentLevel = level;
  }

  /**
   * @param {import("@nodesecure/vis-network").NodeSecureDataSet} secureDataSet
   * @param {import("@nodesecure/vis-network").NodeSecureNetwork} nsn
   */
  constructor(secureDataSet, nsn) {
    this.#secureDataSet = secureDataSet;
    this.#nsn = nsn;

    this.#nodes = [...this.#secureDataSet.linker]
      .map(([nodeId, { id, name, usedBy }]) => /** @type {[number, NavNode]} */ ([
        nodeId,
        {
          id,
          name,
          usedBy,
          position: nsn.network.getPosition(id)
        }
      ]));

    this.#dependenciesMapByLevel.set(0, this.rootNodeParams);

    window.addEventListener(EVENTS.MOVED_TO_NEXT_LOCKED_NODE, () => {
      this.#moveToNextLockedNode();
    });
    window.addEventListener(EVENTS.MOVED_TO_PREVIOUS_LOCKED_NODE, () => {
      this.#moveToPreviousLockedNode();
    });

    document.addEventListener("keydown", (event) => {
      const networkView = /** @type {HTMLElement} */ (document.getElementById("network--view"));
      const wikiRoot = /** @type {HTMLElement} */ (document.getElementById("documentation-root-element"));
      const isNetworkViewHidden = networkView.classList.contains("hidden");
      const isWikiOpen = wikiRoot.classList.contains("slide-in");
      const eventTarget = /** @type {HTMLElement} */ (event.target);
      const isTargetPopup = eventTarget.id === "popup--background";
      const isTargetInput = eventTarget.tagName === "INPUT";
      const commandPalette = /** @type {(HTMLElement & { open: boolean }) | null} */ (document.querySelector("command-palette"));
      const isSearchCommandOpen = Boolean(commandPalette?.open);
      if (isNetworkViewHidden || isWikiOpen || isTargetPopup || isTargetInput || isSearchCommandOpen) {
        return;
      }

      if (event.code === "Enter") {
        this.#packageInfoFocus = !this.#packageInfoFocus;
        console.log(`[INFO] keyboard navigation switched (focus:${this.#packageInfoFocus ? "package-info" : "network"})`);
      }

      if (this.#packageInfoFocus) {
        if (["ArrowLeft", "ArrowRight"].includes(event.code)) {
          const direction = event.code === "ArrowLeft" ? "previous" : "next";
          PackageInfo.switch(direction);
        }
        else if (["ArrowUp", "ArrowDown"].includes(event.code)) {
          const direction = event.code === "ArrowUp" ? "up" : "down";
          PackageInfo.scroll(direction);
        }

        return;
      }

      const nodeParam = this.#currentNodeParams ?? this.rootNodeParams;

      this.#updateLockedNodes();

      if (this.#hasLockedNodes()) {
        this.#navigateBetweenLockedNodes(event);

        return;
      }

      const nodeDependencyName = this.#getLinkerEntry(Number(nodeParam.nodes[0])).name;

      this.#currentNodeUsedBy = this.#nodes
        .filter(([_, opt]) => Object.keys(this.#getLinkerEntry(Number(nodeParam.nodes[0])).usedBy).includes(opt.name));
      this.#usedByCurrentNode = this.#nodes.filter(([_, opt]) => Reflect.has(opt.usedBy, nodeDependencyName));

      this.#currentNode = this.#nodes.find(([id]) => id === Number(nodeParam.nodes[0]));

      if (this.#currentLevel > 0 && this.#dependenciesMapByLevel.get(this.#currentLevel - 1) === undefined) {
        this.#dependenciesMapByLevel.set(this.#currentLevel - 1, { nodes: [this.#currentNodeUsedBy[0][0]] });
      }

      switch (event.code) {
        case "ArrowLeft":
          this.#moveToPreviousDependency();
          break;
        case "ArrowRight":
          this.#moveToNextDependency();
          break;
        case "ArrowUp":
          this.#moveToNextLevel();
          break;
        case "ArrowDown":
          this.#moveToPreviousLevel();
          break;
        default:
          break;
      }
    });
  }

  /**
   * @param {number} id
   * @returns {import("@nodesecure/vis-network").LinkerEntry}
   */
  #getLinkerEntry(id) {
    return /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (this.#secureDataSet.linker.get(id));
  }

  /**
   * @param {[number, NavNode]} node
   */
  #navigateTreeLevel(node) {
    const activeNode = node[0];
    this.#nsn.focusNodeById(activeNode);
    this.#currentNodeParams = {
      nodes: [activeNode],
      edges: this.#nsn.network.getConnectedEdges(activeNode)
    };

    this.#dependenciesMapByLevel.set(this.#currentLevel, this.#currentNodeParams);
  }

  /**
   * @param {[number, NavNode][]} nodes
   * @returns {[number, NavNode][]}
   */
  #sortByDistance(nodes) {
    const currentNode = /** @type {[number, NavNode]} */ (this.#currentNode);

    return nodes.slice(0).sort((node1, node2) => {
      const distance1 = Math.sqrt(
        Math.pow(node1[1].position.x - currentNode[1].position.x, 2) +
        Math.pow(node1[1].position.y - currentNode[1].position.y, 2)
      );
      const distance2 = Math.sqrt(
        Math.pow(node2[1].position.x - currentNode[1].position.x, 2) +
        Math.pow(node2[1].position.y - currentNode[1].position.y, 2)
      );

      return distance1 - distance2;
    });
  }

  /**
   * @template {{ position: import("vis-network/standalone").Position }} T
   * @param {[number, T][]} nodes
   * @param {import("vis-network/standalone").Position} from
   * @returns {[number, T][]}
   */
  #sortByAngle(nodes, from) {
    return nodes.slice(0).sort((node1, node2) => {
      const angle1 = this.calculateAngle(from, node1[1].position);
      const angle2 = this.calculateAngle(from, node2[1].position);

      return angle1 - angle2;
    });
  }

  #moveToNextLevel() {
    const usedByCurrentNode = /** @type {[number, NavNode][]} */ (this.#usedByCurrentNode);
    if (usedByCurrentNode.length === 0) {
      return;
    }

    this.#currentLevelDependenciesIndex = 0;

    const sortedNodes = this.#sortByDistance(usedByCurrentNode);

    const nextLevelNodeMatchingUseDependencies = usedByCurrentNode
      .find(([id]) => id === this.#dependenciesMapByLevel.get(this.#currentLevel + 1)?.nodes[0]);

    this.#currentLevel++;
    if (nextLevelNodeMatchingUseDependencies) {
      this.#navigateTreeLevel(nextLevelNodeMatchingUseDependencies);
    }
    else {
      this.#navigateTreeLevel(sortedNodes[0]);
    }
  }

  #moveToPreviousLevel() {
    if (this.#currentLevel === 0) {
      return;
    }

    this.#currentLevelDependenciesIndex = 0;

    const previousLevelId = this.#dependenciesMapByLevel.get(this.#currentLevel - 1)?.nodes[0];
    const currentNodeUsedBy = /** @type {[number, NavNode][]} */ (this.#currentNodeUsedBy);
    const previousLevelNodeMatchingUsedByDependencies = currentNodeUsedBy.find(([id]) => id === previousLevelId);

    this.#currentLevel--;
    if (previousLevelNodeMatchingUsedByDependencies) {
      this.#navigateTreeLevel(previousLevelNodeMatchingUsedByDependencies);
    }
    else {
      this.#navigateTreeLevel(currentNodeUsedBy[0]);
    }
  }

  #moveToNextDependency() {
    if (this.#currentLevel === 0) {
      return;
    }

    const previousLevelParams = /** @type {LevelParams} */ (this.#dependenciesMapByLevel.get(this.#currentLevel - 1));
    const currentLevelParams = /** @type {LevelParams} */ (this.#dependenciesMapByLevel.get(this.#currentLevel));
    const previousNodeDependencyName = this.#getLinkerEntry(previousLevelParams.nodes[0]).name;
    const useByPrevious = this.#nodes
      .filter(([_, opt]) => Reflect.has(opt.usedBy, previousNodeDependencyName) &&
        opt.id !== previousLevelParams.nodes[0]
      );

    const curr = /** @type {[number, NavNode]} */ (this.#nodes.find((node) => node[0] === currentLevelParams.nodes[0]));
    const prev = /** @type {[number, NavNode]} */ (this.#nodes.find((node) => node[0] === previousLevelParams.nodes[0]));

    const sortedNodes = this.#sortByAngle(useByPrevious, prev[1].position);

    if (useByPrevious.length <= 1) {
      return;
    }

    const currIndex = sortedNodes.findIndex((node) => node[0] === curr[0]);
    if (this.#currentLevelDependenciesIndex !== currIndex) {
      // instantly increment to make depIndex be the next node index.
      this.#currentLevelDependenciesIndex = currIndex + 1;
      if (this.#currentLevelDependenciesIndex >= sortedNodes.length || this.#currentLevelDependenciesIndex === -1) {
        this.#currentLevelDependenciesIndex = 0;
      }
    }

    if (sortedNodes[this.#currentLevelDependenciesIndex][0] === curr[0]) {
      this.#currentLevelDependenciesIndex++;
      if (this.#currentLevelDependenciesIndex >= sortedNodes.length || this.#currentLevelDependenciesIndex === -1) {
        this.#currentLevelDependenciesIndex = 0;
      }
    }

    const nearthestNode = sortedNodes[this.#currentLevelDependenciesIndex];
    this.#navigateTreeLevel(nearthestNode);
  }

  #moveToPreviousDependency() {
    if (this.#currentLevel === 0) {
      return;
    }

    const previousLevelParams = /** @type {LevelParams} */ (this.#dependenciesMapByLevel.get(this.#currentLevel - 1));
    const currentLevelParams = /** @type {LevelParams} */ (this.#dependenciesMapByLevel.get(this.#currentLevel));
    const previousNodeDependencyName = this.#getLinkerEntry(previousLevelParams.nodes[0]).name;
    const useByPrevious = this.#nodes
      .filter(([_, opt]) => Reflect.has(opt.usedBy, previousNodeDependencyName) &&
        opt.id !== previousLevelParams.nodes[0]
      );

    const curr = /** @type {[number, NavNode]} */ (this.#nodes.find((node) => node[0] === currentLevelParams.nodes[0]));
    const prev = /** @type {[number, NavNode]} */ (this.#nodes.find((node) => node[0] === previousLevelParams.nodes[0]));
    const sortedNodes = this.#sortByAngle(useByPrevious, prev[1].position);

    if (useByPrevious.length <= 1) {
      return;
    }

    const currIndex = sortedNodes.findIndex((node) => node[0] === curr[0]);
    if (this.#currentLevelDependenciesIndex !== currIndex) {
      // instantly decrement to make depIndex be the previous node index.
      this.#currentLevelDependenciesIndex = currIndex - 1;
      if (this.#currentLevelDependenciesIndex > 0) {
        this.#currentLevelDependenciesIndex = sortedNodes.length - 1;
      }
    }

    if (sortedNodes[this.#currentLevelDependenciesIndex][0] === curr[0]) {
      this.#currentLevelDependenciesIndex--;
      if (this.#currentLevelDependenciesIndex < 0) {
        this.#currentLevelDependenciesIndex = sortedNodes.length - 1;
      }
    }

    const nearthestNode = sortedNodes[this.#currentLevelDependenciesIndex];
    this.#navigateTreeLevel(nearthestNode);
  }

  #updateLockedNodes() {
    if (this.#nsn.lastHighlightedIds === null) {
      this.#lockedNodes = [];
    }
    else {
      this.#lockedNodes = this.#sortByAngle(
        [...this.#nsn.lastHighlightedIds].map(
          (id) => {
            const numericId = Number(id);

            /** @type {[number, import("@nodesecure/vis-network").LinkerEntry & { position: import("vis-network/standalone").Position }]} */
            return [
              numericId,
              {
                ...this.#getLinkerEntry(numericId),
                position: this.#nsn.network.getPosition(id)
              }
            ];
          }
        ),
        { ...this.#nsn.network.getPosition(this.rootNodeParams.nodes[0]) }
      );
    }
  }

  #moveToPreviousLockedNode() {
    this.#updateLockedNodes();
    if (this.#hasLockedNodes()) {
      this.#selectPreviousLockedNode();
      this.#focusOnActiveLockedNode();
    }
  }

  #moveToNextLockedNode() {
    this.#updateLockedNodes();
    if (this.#hasLockedNodes()) {
      this.#selectNextLockedNode();
      this.#focusOnActiveLockedNode();
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  #navigateBetweenLockedNodes(event) {
    switch (event.code) {
      case "ArrowLeft":
        this.#selectPreviousLockedNode();
        break;
      case "ArrowRight":
        this.#selectNextLockedNode();
        break;
      default:
        return;
    }

    this.#focusOnActiveLockedNode();
  }

  #selectPreviousLockedNode() {
    if (this.#lockedNodesActiveIndex === 0) {
      this.#lockedNodesActiveIndex = this.#lockedNodes.length - 1;
    }
    else {
      this.#lockedNodesActiveIndex--;
    }
  }

  #selectNextLockedNode() {
    if (this.#lockedNodesActiveIndex === this.#lockedNodes.length - 1) {
      this.#lockedNodesActiveIndex = 0;
    }
    else {
      this.#lockedNodesActiveIndex++;
    }
  }

  #focusOnActiveLockedNode() {
    this.#nsn.network.focus(this.#lockedNodes[this.#lockedNodesActiveIndex][0], {
      animation: true,
      scale: 0.35,
      offset: { x: 150, y: 0 }
    });
  }

  #hasLockedNodes() {
    return this.#lockedNodes.length > 0;
  }
}
