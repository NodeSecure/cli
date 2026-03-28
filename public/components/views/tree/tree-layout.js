// CONSTANTS
export const CARD_WIDTH = 250;
export const CONNECTOR_GAP = 16;
export const GAP_ROW_HEIGHT = 16;

export function getSortedChildren(nodeId, childrenByParent, linker) {
  return (childrenByParent.get(nodeId) ?? [])
    .sort((idA, idB) => linker.get(idA).name.localeCompare(linker.get(idB).name));
}

export function buildChildrenMap(rawEdgesData) {
  const childrenByParent = new Map();
  for (const edge of rawEdgesData) {
    const children = childrenByParent.get(edge.to) ?? [];
    children.push(edge.from);
    childrenByParent.set(edge.to, children);
  }

  return childrenByParent;
}

export function computeDepthGroups(rawEdgesData) {
  const childrenByParent = buildChildrenMap(rawEdgesData);

  const depthMap = new Map();
  depthMap.set(0, 0);
  const queue = [0];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentDepth = depthMap.get(current);

    for (const childId of (childrenByParent.get(current) ?? [])) {
      if (!depthMap.has(childId)) {
        depthMap.set(childId, currentDepth + 1);
        queue.push(childId);
      }
    }
  }

  const byDepth = new Map();
  for (const [nodeId, depth] of depthMap) {
    const group = byDepth.get(depth) ?? [];
    group.push(nodeId);
    byDepth.set(depth, group);
  }

  return new Map([...byDepth.entries()].sort((entryA, entryB) => entryA[0] - entryB[0]));
}

/**
 * Recursively builds grid cells for a subtree.
 * Returns the total number of rows used.
 * Appends cells to the `cells` array (children before parent).
 */
function buildSubtree({ nodeId, col, startRow, parentId, ancestors, childrenByParent, linker, cells }) {
  if (ancestors.has(nodeId)) {
    cells.push({ nodeId, col, row: startRow, rowSpan: 1, parentId, isCyclic: true });

    return 1;
  }

  const newAncestors = new Set(ancestors);
  newAncestors.add(nodeId);

  const children = getSortedChildren(nodeId, childrenByParent, linker);

  if (children.length === 0) {
    cells.push({ nodeId, col, row: startRow, rowSpan: 1, parentId, isCyclic: false });

    return 1;
  }

  let totalRows = 0;
  let childRow = startRow;

  for (const childId of children) {
    const childRows = buildSubtree({
      nodeId: childId, col: col + 1,
      startRow: childRow,
      parentId: nodeId,
      ancestors: newAncestors,
      childrenByParent,
      linker,
      cells
    });
    childRow += childRows;
    totalRows += childRows;
  }

  cells.push({ nodeId, col, row: startRow, rowSpan: totalRows, parentId, isCyclic: false });

  return totalRows;
}

/**
 * Builds the full tree layout as a unified CSS grid.
 * Returns cells[] and the total row count (including gap rows).
 */
export function computeTreeLayout(rawEdgesData, linker) {
  const childrenByParent = buildChildrenMap(rawEdgesData);
  const cells = [];
  let currentRow = 1;

  const rootChildren = getSortedChildren(0, childrenByParent, linker);

  for (let index = 0; index < rootChildren.length; index++) {
    const childId = rootChildren[index];
    const rowsUsed = buildSubtree({
      nodeId: childId, col: 1, startRow: currentRow, parentId: 0,
      ancestors: new Set([0]), childrenByParent, linker, cells
    });
    currentRow += rowsUsed;

    if (index < rootChildren.length - 1) {
      cells.push({ isGap: true, row: currentRow });
      currentRow++;
    }
  }

  const totalRows = currentRow - 1;

  // Root at col 0, spanning all rows (including gap rows)
  cells.push({
    nodeId: 0,
    col: 0,
    row: 1,
    rowSpan: totalRows,
    parentId: null,
    isCyclic: false,
    isRoot: true
  });

  return { cells, totalRows };
}
