// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";

// Import Internal Dependencies
import { EVENTS } from "../../../core/events.js";
import { currentLang } from "../../../common/utils.js";
import "../../root-selector/root-selector.js";

// CONSTANTS
const kSeverityOrder = ["Critical", "Warning", "Information"];
const kSeverityColors = {
  Critical: "#ef4444",
  Warning: "#f97316",
  Information: "#3b82f6"
};
const kDocsBaseUrl = "https://github.com/NodeSecure/js-x-ray/blob/master/docs";

function buildWarningsData(secureDataSet) {
  const nodeIdBySpec = new Map();
  for (const [nodeId, entry] of secureDataSet.linker) {
    const spec = `${entry.name}@${entry.version}`;
    if (!nodeIdBySpec.has(spec)) {
      nodeIdBySpec.set(spec, nodeId);
    }
  }

  const byKind = new Map();
  for (const [packageName, dependency] of Object.entries(secureDataSet.data.dependencies)) {
    for (const [version, versionData] of Object.entries(dependency.versions)) {
      const filteredWarnings = versionData.warnings.filter(
        (warning) => !window.settings.config.ignore.warnings.has(warning.kind)
      );

      for (const warning of filteredWarnings) {
        const { kind, severity } = warning;
        if (!byKind.has(kind)) {
          byKind.set(kind, { kind, severity, packages: new Map() });
        }

        const kindData = byKind.get(kind);
        const spec = `${packageName}@${version}`;
        const existing = kindData.packages.get(spec) ?? {
          name: packageName,
          version,
          nodeId: nodeIdBySpec.get(spec),
          count: 0
        };
        existing.count++;
        kindData.packages.set(spec, existing);
      }
    }
  }

  const grouped = Object.fromEntries(kSeverityOrder.map((severity) => [severity, []]));
  for (const kindData of byKind.values()) {
    const list = grouped[kindData.severity];
    if (list) {
      list.push(kindData);
    }
  }

  for (const list of Object.values(grouped)) {
    list.sort((kindA, kindB) => {
      const totalA = [...kindA.packages.values()].reduce((sum, pkg) => sum + pkg.count, 0);
      const totalB = [...kindB.packages.values()].reduce((sum, pkg) => sum + pkg.count, 0);

      return totalB - totalA;
    });
  }

  let totalWarnings = 0;
  const affectedSpecs = new Set();
  for (const kindData of byKind.values()) {
    for (const [spec, pkg] of kindData.packages) {
      totalWarnings += pkg.count;
      affectedSpecs.add(spec);
    }
  }

  return { grouped, totalWarnings, totalPackages: affectedSpecs.size };
}

function countBySeverity(grouped) {
  return Object.fromEntries(
    kSeverityOrder.map((severity) => [
      severity,
      grouped[severity].reduce(
        (sum, kindData) => sum + [...kindData.packages.values()].reduce((s, pkg) => s + pkg.count, 0),
        0
      )
    ])
  );
}

export class WarningsView extends LitElement {
  static properties = {
    secureDataSet: { attribute: false }
  };

  static styles = css`
    [class^="icon-"]::before, [class*=" icon-"]::before {
      font-family: fontello;
      font-style: normal;
      font-weight: normal;
      display: inline-block;
      text-decoration: inherit;
      text-align: center;
      font-variant: normal;
      text-transform: none;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .icon-warning::before { content: '\\e80e'; }

    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      font-family: Roboto, sans-serif;
      color: #1a1a2e;
    }

    :host-context(body.dark) {
      color: rgb(255 255 255 / 87%);
    }

    .warnings-header {
      padding: 24px 32px 20px;
      border-bottom: 1px solid rgb(0 0 0 / 7%);
    }

    :host-context(body.dark) .warnings-header {
      border-bottom-color: rgb(255 255 255 / 7%);
    }

    .warnings-header--top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
    }

    .warnings-header h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .warnings-header h1 i {
      font-size: 18px;
      color: #f97316;
    }

    .warnings-subtitle {
      font-size: 16px;
      color: #7a7595;
      margin: 0 0 16px;
    }

    :host-context(body.dark) .warnings-subtitle {
      color: rgb(255 255 255 / 45%);
    }

    .severity-pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .severity-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 15px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1.5px solid currentcolor;
    }

    .severity-pill .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentcolor;
      flex-shrink: 0;
    }

    .severity-pill.critical { color: #ef4444; }
    .severity-pill.warning { color: #f97316; }
    .severity-pill.info { color: #3b82f6; }
    .severity-pill.zero { opacity: 0.35; }

    .warnings-body {
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .severity-section h2 {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0 0 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .severity-section h2 .section-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .kind-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .kind-card {
      background: white;
      border-radius: 10px;
      border: 1px solid rgb(0 0 0 / 7%);
      overflow: hidden;
    }

    :host-context(body.dark) .kind-card {
      background: #1e1c2e;
      border-color: rgb(255 255 255 / 7%);
    }

    .kind-card--header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px 10px;
    }

    .kind-name {
      font-size: 16px;
      font-weight: 600;
      flex: 1;
      font-family: mononoki, monospace;
    }

    .severity-badge {
      font-size: 13px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      color: white;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .docs-link {
      font-size: 14px;
      color: #7c6fff;
      text-decoration: none;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }

    .docs-link:hover { opacity: 1; }

    :host-context(body.dark) .docs-link { color: #a394ff; }

    .kind-card--meta {
      font-size: 14px;
      color: #7a7595;
      padding: 0 16px 10px;
    }

    :host-context(body.dark) .kind-card--meta {
      color: rgb(255 255 255 / 40%);
    }

    .kind-card--packages {
      border-top: 1px solid rgb(0 0 0 / 5%);
      padding: 6px 0;
    }

    :host-context(body.dark) .kind-card--packages {
      border-top-color: rgb(255 255 255 / 5%);
    }

    .pkg-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 16px;
      cursor: pointer;
      transition: background 0.12s;
    }

    .pkg-row:hover {
      background: rgb(124 111 255 / 6%);
    }

    :host-context(body.dark) .pkg-row:hover {
      background: rgb(163 148 255 / 8%);
    }

    .pkg-name {
      font-size: 16px;
      font-family: mononoki, monospace;
      flex: 1;
    }

    .pkg-name .version {
      color: #7c6fff;
    }

    :host-context(body.dark) .pkg-name .version {
      color: #a394ff;
    }

    .pkg-count {
      font-size: 14px;
      font-weight: 600;
      color: #7a7595;
      background: rgb(0 0 0 / 5%);
      border-radius: 4px;
      padding: 1px 6px;
      flex-shrink: 0;
    }

    :host-context(body.dark) .pkg-count {
      background: rgb(255 255 255 / 7%);
      color: rgb(255 255 255 / 45%);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 80px 32px;
      color: #7a7595;
      text-align: center;
    }

    .empty-state .checkmark {
      font-size: 40px;
      color: #22c55e;
    }

    .empty-state p {
      font-size: 15px;
      margin: 0;
    }
  `;

  #onPackageClick(nodeId) {
    if (nodeId === undefined) {
      return;
    }

    window.dispatchEvent(new CustomEvent(EVENTS.WARNINGS_PACKAGE_CLICK, {
      detail: { nodeId }
    }));
  }

  #renderKindCard(kindData) {
    const i18n = window.i18n[currentLang()];
    const packages = [...kindData.packages.values()];
    const totalCount = packages.reduce((sum, pkg) => sum + pkg.count, 0);
    const color = kSeverityColors[kindData.severity] ?? "#6b7280";
    const severityLabel = i18n.warnings[kindData.severity.toLowerCase()];
    const docsLabel = i18n.warnings.docs;

    return html`
      <div class="kind-card">
        <div class="kind-card--header">
          <span class="kind-name">${kindData.kind}</span>
          <span class="severity-badge" style="background: ${color}">${severityLabel}</span>
          <a
            class="docs-link"
            href="${kDocsBaseUrl}/${kindData.kind}.md"
            target="_blank"
            rel="noopener noreferrer"
            @click=${(event) => event.stopPropagation()}
          >${docsLabel} ↗</a>
        </div>
        <div class="kind-card--meta">
          ${packages.length} ${i18n.warnings.packages} · ${totalCount} ${i18n.warnings.occurrences}
        </div>
        <div class="kind-card--packages">
          ${packages.sort((pkgA, pkgB) => pkgB.count - pkgA.count).map((pkg) => html`
            <div class="pkg-row" @click=${() => this.#onPackageClick(pkg.nodeId)}>
              <span class="pkg-name">${pkg.name}<span class="version">@${pkg.version}</span></span>
              <span class="pkg-count">×${pkg.count}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  #renderSeveritySection(severity, kindList, i18n) {
    if (kindList.length === 0) {
      return nothing;
    }

    const color = kSeverityColors[severity];
    const label = i18n.warnings[severity.toLowerCase()];

    return html`
      <div class="severity-section">
        <h2>
          <span class="section-dot" style="background: ${color}"></span>
          ${label}
        </h2>
        <div class="kind-list">
          ${kindList.map((kindData) => this.#renderKindCard(kindData))}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.secureDataSet) {
      return nothing;
    }

    const i18n = window.i18n[currentLang()];
    const { grouped, totalWarnings, totalPackages } = buildWarningsData(this.secureDataSet);
    const bySeverity = countBySeverity(grouped);
    const hasWarnings = totalWarnings > 0;

    return html`
      <div class="warnings-header">
        <div class="warnings-header--top">
          <h1>
            <i class="icon-warning"></i>
            ${i18n.warnings.title}
          </h1>
          <root-selector .secureDataSet=${this.secureDataSet}></root-selector>
        </div>
        <p class="warnings-subtitle">
          ${totalWarnings} ${i18n.warnings.totalWarnings} · ${totalPackages} ${i18n.warnings.totalPackages}
        </p>
        <div class="severity-pills">
          ${kSeverityOrder.map((severity) => {
            const count = bySeverity[severity];
            const pillClass = severity === "Information" ? "info" : severity.toLowerCase();

            return html`
              <span class="severity-pill ${pillClass} ${count === 0 ? "zero" : ""}">
                <span class="dot"></span>
                ${count} ${i18n.warnings[severity.toLowerCase()]}
              </span>
            `;
          })}
        </div>
      </div>
      <div class="warnings-body">
        ${hasWarnings
            ? kSeverityOrder.map(
              (severity) => this.#renderSeveritySection(severity, grouped[severity], i18n)
            )
            : html`
            <div class="empty-state">
              <span class="checkmark">✓</span>
              <p>${i18n.warnings.noWarnings}</p>
            </div>
          `
        }
      </div>
    `;
  }
}

customElements.define("warnings-view", WarningsView);
