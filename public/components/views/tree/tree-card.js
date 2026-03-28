// Import Third-party Dependencies
import { html, nothing } from "lit";
import { FLAGS_EMOJIS } from "@nodesecure/vis-network";
import prettyBytes from "pretty-bytes";

// Import Internal Dependencies
import { EVENTS } from "../../../core/events.js";

// CONSTANTS
const kWarningCriticalThreshold = 10;
const kModuleTypeColors = {
  esm: "#10b981",
  dual: "#06b6d4",
  cjs: "#f59e0b",
  dts: "#6366f1",
  faux: "#6b7280"
};

function renderFlag(flag) {
  const ignoredFlags = window.settings.config.ignore.flags ?? [];
  const ignoredSet = new Set(ignoredFlags);
  if (ignoredSet.has(flag)) {
    return nothing;
  }

  const emoji = FLAGS_EMOJIS[flag];
  if (!emoji) {
    return nothing;
  }

  return html`<span class="flag" title="${flag}">${emoji}</span>`;
}

function getVersionData(secureDataSet, name, version) {
  return secureDataSet.data.dependencies[name]?.versions[version];
}

export function renderCardContent(secureDataSet, { nodeId, parentId = null, isRoot = false }) {
  const entry = secureDataSet.linker.get(nodeId);
  const versionData = getVersionData(secureDataSet, entry.name, entry.version);
  if (!versionData) {
    return nothing;
  }

  const warningCount = versionData.warnings?.length ?? 0;

  let warningClass = "";
  if (warningCount > kWarningCriticalThreshold) {
    warningClass = "warn-critical";
  }
  else if (warningCount > 0) {
    warningClass = "warn-moderate";
  }

  const hasProvenance = Boolean(versionData.attestations?.provenance);
  const moduleType = versionData.type ?? "cjs";
  const typeColor = kModuleTypeColors[moduleType] ?? "#6b7280";
  const size = prettyBytes(versionData.size ?? 0);
  const licenses = versionData.uniqueLicenseIds?.join(", ") ?? "—";
  const depCount = versionData.dependencyCount ?? 0;
  const flags = versionData.flags ?? [];
  const rootClass = isRoot ? "tree-card--root" : "";

  // Show parent label only for packages at depth ≥ 2 (parentId !== null and not root)
  let parentName = null;
  if (parentId !== null && parentId !== 0) {
    const parentEntry = secureDataSet.linker.get(parentId);
    if (parentEntry) {
      parentName = parentEntry.name;
    }
  }

  return html`
    <div
      class="tree-card ${warningClass} ${rootClass}"
      @click=${() => window.dispatchEvent(new CustomEvent(EVENTS.TREE_NODE_CLICK, { detail: { nodeId } }))}
    >
      <div class="tree-card--header">
        <span class="tree-card--name" title="${entry.name}@${entry.version}">
          ${entry.name}<span class="tree-card--version">@${entry.version}</span>
        </span>
        ${hasProvenance
            ? html`<span class="tree-card--provenance" title="Published with npm provenance">✓</span>`
            : nothing
        }
      </div>
      <div class="tree-card--meta">
        <span class="tree-card--type" style="--type-color: ${typeColor}">${moduleType}</span>
        <span class="tree-card--flags">
          ${flags.map((flag) => renderFlag(flag))}
        </span>
      </div>
      <div class="tree-card--stats">
        <span class="tree-card--size">${size}</span>
        <span class="tree-card--separator">·</span>
        <span class="tree-card--license">${licenses}</span>
        ${depCount > 0
            ? html`<span class="tree-card--separator">·</span><span>${depCount} deps</span>`
            : nothing
        }
        ${warningCount > 0
            ? html`<span class="tree-card--warnings"><i class="icon-warning-empty"></i> ${warningCount}</span>`
            : nothing
        }
      </div>
      ${parentName === null
          ? nothing
          : html`<div class="tree-card--stats"><span class="tree-card--separator">↳ ${parentName}</span></div>`
      }
    </div>
  `;
}
