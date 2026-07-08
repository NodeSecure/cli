// Import Internal Dependencies
import { CONNECTOR_GAP } from "./tree-layout.js";

export function drawConnectors(renderRoot) {
  const grid = renderRoot.querySelector(".tree-grid");
  if (!grid) {
    return;
  }

  // Remove existing SVG
  grid.querySelector(".connectors-svg")?.remove();

  const gridRect = grid.getBoundingClientRect();
  if (gridRect.width === 0) {
    return;
  }

  const cells = grid.querySelectorAll(".tree-cell");

  // Map each wrapper element to its rects:
  // - span bounds (top/bottom) from the stretched wrapper, for parent lookup
  // - midY from the inner card, for line anchoring at the visual card center
  const elementRects = new Map();
  for (const cell of cells) {
    const wrapperRaw = cell.getBoundingClientRect();
    const cardEl = cell.firstElementChild;
    const cardRaw = cardEl ? cardEl.getBoundingClientRect() : wrapperRaw;

    elementRects.set(cell, {
      left: wrapperRaw.left - gridRect.left,
      right: wrapperRaw.right - gridRect.left,
      top: wrapperRaw.top - gridRect.top,
      bottom: wrapperRaw.bottom - gridRect.top,
      midY: cardRaw.top - gridRect.top + (cardRaw.height / 2)
    });
  }

  // Resolve parent element for each child using spatial overlap:
  // among all cells matching data-parent-id, pick the one whose vertical
  // span (stretched to fill its grid rows) contains the child's midY.
  const elementChildren = new Map();
  for (const child of cells) {
    const rawParentId = child.dataset.parentId;
    if (!rawParentId) {
      continue;
    }

    const parentId = Number(rawParentId);
    const childMidY = elementRects.get(child).midY;

    let bestParent = null;
    for (const candidate of cells) {
      if (Number(candidate.dataset.nodeId) !== parentId) {
        continue;
      }

      const candidateRect = elementRects.get(candidate);
      if (childMidY >= candidateRect.top && childMidY <= candidateRect.bottom) {
        bestParent = candidate;
        break;
      }
    }

    if (bestParent) {
      const children = elementChildren.get(bestParent) ?? [];
      children.push(child);
      elementChildren.set(bestParent, children);
    }
  }

  const isDark = document.body.classList.contains("dark");
  const strokeColor = isDark
    ? "rgba(164, 148, 255, 0.3)"
    : "rgba(55, 34, 175, 0.18)";

  const svgNS = "http://www.w3.org/2000/svg";
  const svgEl = document.createElementNS(svgNS, "svg");
  svgEl.classList.add("connectors-svg");

  let hasPath = false;

  for (const [parent, children] of elementChildren) {
    const parentRect = elementRects.get(parent);
    const childRects = children.map((child) => elementRects.get(child));

    const midX = parentRect.right + (CONNECTOR_GAP / 2);
    const childMidYs = childRects.map((rect) => rect.midY).sort((rectA, rectB) => rectA - rectB);
    const firstChildY = childMidYs[0];
    const lastChildY = childMidYs.at(-1);

    let pathData = `M ${parentRect.right} ${parentRect.midY} H ${midX}`;

    // Vertical arm connecting to children's level
    if (Math.abs(parentRect.midY - firstChildY) > 1) {
      const targetY = childMidYs.length === 1
        ? firstChildY
        : (firstChildY + lastChildY) / 2;
      pathData += ` V ${targetY}`;
    }

    // Vertical bracket if multiple children
    if (childMidYs.length > 1) {
      pathData += ` M ${midX} ${firstChildY} V ${lastChildY}`;
    }

    // Horizontal branch to each child
    for (const childRect of childRects) {
      pathData += ` M ${midX} ${childRect.midY} H ${childRect.left}`;
    }

    const pathEl = document.createElementNS(svgNS, "path");
    pathEl.setAttribute("d", pathData);
    pathEl.setAttribute("fill", "none");
    pathEl.setAttribute("stroke", strokeColor);
    pathEl.setAttribute("stroke-width", "1.5");
    pathEl.setAttribute("stroke-linecap", "round");
    pathEl.setAttribute("stroke-linejoin", "round");
    svgEl.appendChild(pathEl);
    hasPath = true;
  }

  if (hasPath) {
    grid.insertBefore(svgEl, grid.firstChild);
  }
}
