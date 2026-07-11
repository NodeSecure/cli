// Import Third-party Dependencies
import { LitElement, html, nothing } from "lit";

// Import Internal Dependencies
import { getI18n } from "../../../common/utils.js";
import { EVENTS } from "../../../core/events.js";
import { treeStyles } from "./tree-styles.js";
import {
  CARD_WIDTH,
  CONNECTOR_GAP,
  GAP_ROW_HEIGHT,
  ACTIVITY_GROUPS,
  computeDepthGroups,
  computeTreeLayout,
  computeActivityGroups
} from "./tree-layout.js";
import { renderCardContent } from "./tree-card.js";
import { drawConnectors } from "./tree-connectors.js";
import "../../root-selector/root-selector.js";

export class TreeView extends LitElement {
  static styles = treeStyles;

  static properties = {
    secureDataSet: { attribute: false },
    _mode: { state: true }
  };

  constructor() {
    super();
    /** @type {import("@nodesecure/vis-network").NodeSecureDataSet | null} */
    this.secureDataSet = null;
    this._mode = "depth";
  }

  updated() {
    if (this._mode === "tree") {
      requestAnimationFrame(() => drawConnectors(this.renderRoot));
    }
  }

  /**
   * @returns {Record<string, any>}
   */
  #getTreeI18n() {
    return /** @type {Record<string, any>} */ (/** @type {unknown} */ (getI18n().tree));
  }

  /**
   * @param {number} depth
   * @param {number[]} nodeIds
   */
  #renderDepthColumn(depth, nodeIds) {
    const i18n = this.#getTreeI18n();
    const label = depth === 0
      ? i18n.root
      : `${i18n.depth} ${depth}`;

    const secureDataSet = /** @type {import("@nodesecure/vis-network").NodeSecureDataSet} */ (this.secureDataSet);
    const sortedNodeIds = [...nodeIds].sort((idA, idB) => {
      const entryA = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (secureDataSet.linker.get(idA));
      const entryB = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (secureDataSet.linker.get(idB));

      return entryA.name.localeCompare(entryB.name);
    });

    return html`
      <div class="depth-column">
        <div class="depth-column--header">
          <span class="depth-column--label">${label}</span>
          <span class="depth-column--count">${sortedNodeIds.length}</span>
        </div>
        <div class="depth-column--cards">
          ${sortedNodeIds.map((nodeId) => renderCardContent(secureDataSet, { nodeId }))}
        </div>
      </div>
    `;
  }

  /**
   * @param {Map<number, number[]>} depthGroups
   */
  #renderDepthMode(depthGroups) {
    return html`
      <div class="depth-container">
        ${[...depthGroups.entries()].map(
          ([depth, nodeIds]) => this.#renderDepthColumn(depth, nodeIds)
        )}
      </div>
    `;
  }

  /**
   * @param {number} maxDepth
   */
  #renderTreeMode(maxDepth) {
    const secureDataSet = /** @type {import("@nodesecure/vis-network").NodeSecureDataSet} */ (this.secureDataSet);
    const { cells, totalRows } = computeTreeLayout(secureDataSet.rawEdgesData, secureDataSet.linker);

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
                  style="grid-column: ${(cell.col ?? 0) + 1};
                  grid-row: ${cell.row} / span ${cell.rowSpan}; width: ${CARD_WIDTH}px"
                >
                  <div
                    class="tree-card"
                    style="align-self: start"
                    @click=${() => window.dispatchEvent(
                      new CustomEvent(EVENTS.TREE_NODE_CLICK, { detail: { nodeId: cell.nodeId } })
                    )}
                  >
                    <div class="tree-card--header">
                      <span class="tree-card--name">${/** @type {import("@nodesecure/vis-network").LinkerEntry} */ (
                        secureDataSet.linker.get(/** @type {number} */ (cell.nodeId))
                      ).name}</span>
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
                style="grid-column: ${(cell.col ?? 0) + 1}; grid-row: ${cell.row} / span ${cell.rowSpan}; width: ${CARD_WIDTH}px"
              >
                ${renderCardContent(secureDataSet, {
                  nodeId: /** @type {number} */ (cell.nodeId),
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

  /**
   * @param {typeof ACTIVITY_GROUPS[number]} bucket
   * @param {number[]} nodeIds
   */
  #renderActivityColumn(bucket, nodeIds) {
    const i18n = this.#getTreeI18n();
    const labelKey = `activity${bucket.key.charAt(0).toUpperCase()}${bucket.key.slice(1)}`;
    const secureDataSet = /** @type {import("@nodesecure/vis-network").NodeSecureDataSet} */ (this.secureDataSet);
    const dsData = /** @type {NonNullable<import("@nodesecure/vis-network").NodeSecureDataSet["data"]>} */ (secureDataSet.data);

    return html`
      <div class="depth-column">
        <div class="depth-column--header" style="border-bottom-color: ${bucket.color}">
          <span class="depth-column--label" style="color: ${bucket.color}">${i18n[labelKey]}</span>
          <span class="depth-column--count" style="background: ${bucket.color}">${nodeIds.length}</span>
        </div>
        <div class="depth-column--cards">
          ${nodeIds.map((nodeId) => {
            const entry = /** @type {import("@nodesecure/vis-network").LinkerEntry} */ (secureDataSet.linker.get(nodeId));
            const publishedAt = dsData.dependencies[entry.name]?.metadata?.lastUpdateAt ?? null;

            return renderCardContent(secureDataSet, { nodeId, publishedAt, publishedColor: bucket.color });
          })}
        </div>
      </div>
    `;
  }

  #renderActivityMode() {
    const secureDataSet = /** @type {import("@nodesecure/vis-network").NodeSecureDataSet} */ (this.secureDataSet);
    const dsData = /** @type {NonNullable<import("@nodesecure/vis-network").NodeSecureDataSet["data"]>} */ (secureDataSet.data);
    const activityGroups = computeActivityGroups(
      secureDataSet.linker,
      dsData.dependencies
    );

    return html`
      <div class="depth-container">
        ${ACTIVITY_GROUPS.map((bucket) => this.#renderActivityColumn(bucket, activityGroups.get(bucket.key) ?? []))}
      </div>
    `;
  }

  /**
   * @param {Map<number, number[]>} depthGroups
   */
  #renderHeader(depthGroups) {
    const secureDataSet = /** @type {import("@nodesecure/vis-network").NodeSecureDataSet} */ (this.secureDataSet);
    const dsData = /** @type {NonNullable<import("@nodesecure/vis-network").NodeSecureDataSet["data"]>} */ (secureDataSet.data);
    const totalDeps = Object.keys(dsData.dependencies).length;
    const directDeps = (depthGroups.get(1) ?? []).length;
    const maxDepth = Math.max(...depthGroups.keys());
    const i18n = this.#getTreeI18n();

    return html`
      <div class="page-header">
        <root-selector .secureDataSet=${this.secureDataSet}></root-selector>
        <div class="page-header--stats">
          <span class="page-header--stat-badge">${totalDeps} ${i18n.deps}</span>
          <span class="page-header--stat-badge">${directDeps} ${i18n.direct}</span>
          <span class="page-header--stat-badge">${i18n.depth} ${maxDepth}</span>
        </div>
        <div class="page-header--modes">
          <button
            class="mode-btn ${this._mode === "depth" ? "active" : ""}"
            @click=${() => {
              this._mode = "depth";
            }}
          >${i18n.modeDepth}</button>
          <button
            class="mode-btn ${this._mode === "tree" ? "active" : ""}"
            @click=${() => {
              this._mode = "tree";
            }}
          >${i18n.modeTree}</button>
          <button
            class="mode-btn ${this._mode === "activity" ? "active" : ""}"
            @click=${() => {
              this._mode = "activity";
            }}
          >${i18n.modeActivity}</button>
        </div>
      </div>
    `;
  }

  /**
   * @param {Map<number, number[]>} depthGroups
   * @param {number} maxDepth
   */
  #renderBody(depthGroups, maxDepth) {
    if (this._mode === "tree") {
      return this.#renderTreeMode(maxDepth);
    }
    else if (this._mode === "activity") {
      return this.#renderActivityMode();
    }

    return this.#renderDepthMode(depthGroups);
  }

  render() {
    if (!this.secureDataSet?.data) {
      return nothing;
    }

    const depthGroups = computeDepthGroups(this.secureDataSet.rawEdgesData);
    const maxDepth = Math.max(...depthGroups.keys());

    return html`
      ${this.#renderHeader(depthGroups)}
      ${this.#renderBody(depthGroups, maxDepth)}
    `;
  }
}

customElements.define("tree-view", TreeView);
