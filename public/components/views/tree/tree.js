// Import Third-party Dependencies
import { LitElement, html, nothing } from "lit";

// Import Internal Dependencies
import { currentLang } from "../../../common/utils.js";
import { EVENTS } from "../../../core/events.js";
import { treeStyles } from "./tree-styles.js";
import { CARD_WIDTH, CONNECTOR_GAP, GAP_ROW_HEIGHT, computeDepthGroups, computeTreeLayout } from "./tree-layout.js";
import { renderCardContent } from "./tree-card.js";
import { drawConnectors } from "./tree-connectors.js";
import "../../../components/root-selector/root-selector.js";

class TreeView extends LitElement {
  static styles = treeStyles;

  static properties = {
    secureDataSet: { attribute: false },
    _mode: { state: true }
  };

  constructor() {
    super();
    this.secureDataSet = null;
    this._mode = "depth";
  }

  updated() {
    if (this._mode === "tree") {
      requestAnimationFrame(() => drawConnectors(this.renderRoot));
    }
  }

  #renderDepthColumn(depth, nodeIds) {
    const i18n = window.i18n[currentLang()];
    const label = depth === 0
      ? i18n.tree.root
      : `${i18n.tree.depth} ${depth}`;

    const sortedNodeIds = [...nodeIds].sort((idA, idB) => {
      const entryA = this.secureDataSet.linker.get(idA);
      const entryB = this.secureDataSet.linker.get(idB);

      return entryA.name.localeCompare(entryB.name);
    });

    return html`
      <div class="depth-column">
        <div class="depth-column--header">
          <span class="depth-column--label">${label}</span>
          <span class="depth-column--count">${sortedNodeIds.length}</span>
        </div>
        <div class="depth-column--cards">
          ${sortedNodeIds.map((nodeId) => renderCardContent(this.secureDataSet, { nodeId }))}
        </div>
      </div>
    `;
  }

  #renderDepthMode(depthGroups) {
    return html`
      <div class="depth-container">
        ${[...depthGroups.entries()].map(
          ([depth, nodeIds]) => this.#renderDepthColumn(depth, nodeIds)
        )}
      </div>
    `;
  }

  #renderTreeMode(maxDepth) {
    const { cells, totalRows } = computeTreeLayout(this.secureDataSet.rawEdgesData, this.secureDataSet.linker);

    const colWidth = CARD_WIDTH + CONNECTOR_GAP;
    // +1 for root col
    const numCols = maxDepth + 1;

    return html`
      <div class="tree-body">
        <div
          class="tree-grid"
          style="
            grid-template-columns: repeat(${numCols}, ${CARD_WIDTH}px);
            grid-template-rows: repeat(${totalRows}, auto);
            gap: 4px ${CONNECTOR_GAP}px;
            width: ${(numCols * colWidth) - CONNECTOR_GAP}px;
          "
        >
          ${cells.map((cell) => {
            if (cell.isGap) {
              return html`
                <div
                  class="tree-gap"
                  style="grid-column: 1 / -1; grid-row: ${cell.row}; height: ${GAP_ROW_HEIGHT}px"
                ></div>
              `;
            }

            if (cell.isCyclic) {
              return html`
                <div
                  class="tree-cell"
                  data-node-id="${cell.nodeId}"
                  data-parent-id="${cell.parentId === null ? nothing : cell.parentId}"
                  style="grid-column: ${cell.col + 1}; grid-row: ${cell.row} / span ${cell.rowSpan}; width: ${CARD_WIDTH}px"
                >
                  <div
                    class="tree-card"
                    style="align-self: start"
                    @click=${() => window.dispatchEvent(
                      new CustomEvent(EVENTS.TREE_NODE_CLICK, { detail: { nodeId: cell.nodeId } })
                    )}
                  >
                    <div class="tree-card--header">
                      <span class="tree-card--name">${this.secureDataSet.linker.get(cell.nodeId).name}</span>
                      <span class="tree-card--cyclic" title="Circular dependency">↺ cyclic</span>
                    </div>
                  </div>
                </div>
              `;
            }

            return html`
              <div
                class="tree-cell"
                data-node-id="${cell.nodeId}"
                data-parent-id="${cell.parentId === null ? nothing : cell.parentId}"
                style="grid-column: ${cell.col + 1}; grid-row: ${cell.row} / span ${cell.rowSpan}; width: ${CARD_WIDTH}px"
              >
                ${renderCardContent(this.secureDataSet, {
                  nodeId: cell.nodeId,
                  parentId: cell.parentId,
                  isRoot: cell.isRoot ?? false
                })}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  #renderHeader(depthGroups) {
    const totalDeps = Object.keys(this.secureDataSet.data.dependencies).length;
    const directDeps = (depthGroups.get(1) ?? []).length;
    const maxDepth = Math.max(...depthGroups.keys());
    const i18n = window.i18n[currentLang()];

    return html`
      <div class="page-header">
        <root-selector .secureDataSet=${this.secureDataSet}></root-selector>
        <div class="page-header--stats">
          <span class="page-header--stat-badge">${totalDeps} ${i18n.tree.deps}</span>
          <span class="page-header--stat-badge">${directDeps} ${i18n.tree.direct}</span>
          <span class="page-header--stat-badge">${i18n.tree.depth} ${maxDepth}</span>
        </div>
        <div class="page-header--modes">
          <button
            class="mode-btn ${this._mode === "depth" ? "active" : ""}"
            @click=${() => {
              this._mode = "depth";
            }}
          >${i18n.tree.modeDepth}</button>
          <button
            class="mode-btn ${this._mode === "tree" ? "active" : ""}"
            @click=${() => {
              this._mode = "tree";
            }}
          >${i18n.tree.modeTree}</button>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.secureDataSet?.data) {
      return nothing;
    }

    const depthGroups = computeDepthGroups(
      this.secureDataSet.rawEdgesData,
      this.secureDataSet.linker
    );
    const maxDepth = Math.max(...depthGroups.keys());

    return html`
      ${this.#renderHeader(depthGroups)}
      ${this._mode === "tree"
          ? this.#renderTreeMode(maxDepth)
          : this.#renderDepthMode(depthGroups)
      }
    `;
  }
}

customElements.define("tree-view", TreeView);
