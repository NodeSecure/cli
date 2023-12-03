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
   * @type {import("@nodesecure/vis-network").NodeSecureDataSet["linker"]}
   */
  #nodes;
  /**
   * Represents the current node params.
   *
   * @type {{nodes: number[], edges: string[]}}
   */
  #currentNodeParams;
  /**
   * Represents the current node.
   *
   * @type {[number, import("@nodesecure/vis-network").NodeSecureDataSet["linker"][number]]}
   */
  #currentNode;
  /**
   * Represents the current node dependencies.
   *
   * @type {[number, import("@nodesecure/vis-network").NodeSecureDataSet["linker"][number]][]}
   */
  #currentNodeUsedBy;
  /**
   * Represents the dependencies that depends on the current node.
   *
   * @type {[number, import("@nodesecure/vis-network").NodeSecureDataSet["linker"][number]][]}
   */
  #usedByCurrentNode;

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


  calculateAngle(position1, position2) {
    const dx = position2.x - position1.x;
    const dy = position2.y - position1.y;

    return Math.atan2(dy, dx);
  }

  setLevel(level) {
    this.#currentLevel = level;
  }

  constructor(secureDataSet, nsn) {
    this.#secureDataSet = secureDataSet;
    this.#nsn = nsn;

    this.#nodes = [...this.#secureDataSet.linker]
      .map(([nodeId, { id, name, usedBy }]) => [
        nodeId,
        {
          id,
          name,
          usedBy,
          position: nsn.network.getPosition(id)
        }
      ]);

    this.#dependenciesMapByLevel.set(0, this.rootNodeParams);

    document.addEventListener("keydown", (event) => {
      const isNetworkView = document.getElementById("network--view").classList.contains("hidden") === false;
      if (isNetworkView === false) {
        return;
      }

      const nodeParam = this.#currentNodeParams ?? this.rootNodeParams;
      const nodeDependencyName = this.#secureDataSet.linker.get(nodeParam.nodes[0]).name;

      this.#currentNodeUsedBy = this.#nodes
        .filter(([_, opt]) => Object.keys(this.#secureDataSet.linker.get(nodeParam.nodes[0]).usedBy).includes(opt.name));
      this.#usedByCurrentNode = this.#nodes.filter(([_, opt]) => Reflect.has(opt.usedBy, nodeDependencyName));

      this.#currentNode = this.#nodes.find(([id]) => id === nodeParam.nodes[0]);

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

  #navigateTreeLevel(node) {
    const activeNode = node[0];
    this.#currentNodeParams = {
      nodes: [activeNode],
      edges: this.#nsn.network.getConnectedEdges(activeNode)
    };
    this.#nsn.focusNodeById(activeNode);

    this.#dependenciesMapByLevel.set(this.#currentLevel, this.#currentNodeParams);
  }

  #sortByDistance(nodes) {
    return nodes.slice(0).sort((node1, node2) => {
      const distance1 = Math.sqrt(
        Math.pow(node1[1].position.x - this.#currentNode[1].position.x, 2) +
        Math.pow(node1[1].position.y - this.#currentNode[1].position.y, 2)
      );
      const distance2 = Math.sqrt(
        Math.pow(node2[1].position.x - this.#currentNode[1].position.x, 2) +
        Math.pow(node2[1].position.y - this.#currentNode[1].position.y, 2)
      );

      return distance1 - distance2;
    });
  }

  #sortByAngle(nodes, from) {
    return nodes.slice(0).sort((node1, node2) => {
      const angle1 = this.calculateAngle(from, node1[1].position);
      const angle2 = this.calculateAngle(from, node2[1].position);

      return angle1 - angle2;
    });
  }

  #moveToNextLevel() {
    if (this.#usedByCurrentNode.length === 0) {
      return;
    }

    this.#currentLevelDependenciesIndex = 0;

    const sortedNodes = this.#sortByDistance(this.#usedByCurrentNode);

    const nextLevelNodeMatchingUseDependencies = this.#usedByCurrentNode
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
    const previousLevelNodeMatchingUsedByDependencies = this.#currentNodeUsedBy.find(([id]) => id === previousLevelId);

    this.#currentLevel--;
    if (previousLevelNodeMatchingUsedByDependencies) {
      this.#navigateTreeLevel(previousLevelNodeMatchingUsedByDependencies);
    }
    else {
      this.#navigateTreeLevel(this.#currentNodeUsedBy[0]);
    }
  }

  #moveToNextDependency() {
    if (this.#currentLevel === 0) {
      return;
    }

    const previousNodeDependencyName = this.#secureDataSet.linker.get(
      this.#dependenciesMapByLevel.get(this.#currentLevel - 1).nodes[0]
    ).name;
    const useByPrevious = this.#nodes
      .filter(([_, opt]) => Reflect.has(opt.usedBy, previousNodeDependencyName) &&
        opt.id !== this.#dependenciesMapByLevel.get(this.#currentLevel - 1).nodes[0]
      );

    const curr = this.#nodes.find((node) => node[0] === this.#dependenciesMapByLevel.get(this.#currentLevel).nodes[0]);
    const prev = this.#nodes.find((node) => node[0] ===
      this.#dependenciesMapByLevel.get(this.#currentLevel - 1).nodes[0]
    );

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

    const previousNodeDependencyName = this.#secureDataSet.linker.get(
      this.#dependenciesMapByLevel.get(this.#currentLevel - 1).nodes[0]
    ).name;
    const useByPrevious = this.#nodes
      .filter(([_, opt]) => Reflect.has(opt.usedBy, previousNodeDependencyName) &&
        opt.id !== this.#dependenciesMapByLevel.get(this.#currentLevel - 1).nodes[0]
      );

    const curr = this.#nodes.find((node) => node[0] === this.#dependenciesMapByLevel.get(this.#currentLevel).nodes[0]);
    const prev = this.#nodes.find((node) => node[0] ===
      this.#dependenciesMapByLevel.get(this.#currentLevel - 1).nodes[0]
    );
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
}
