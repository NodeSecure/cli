// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { Task } from "@lit/task";
import { getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";

// Import Internal Dependencies
import { getI18n } from "../../../../common/utils.js";
import { fetchScorecardData, getScorecardLink } from "../../../../common/scorecard.js";
import { scrollbarStyle } from "../../../../common/scrollbar-style.js";
import "../../../icon/icon.js";

export class Scorecard extends LitElement {
  static styles = [scrollbarStyle, css`
:host {
  display: block;
  overflow: hidden auto;
  height: calc(100vh - 315px);
  box-sizing: border-box;
}

p {
  margin: 0;
}

.score-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;
}

.score-header .score-text {
  font-family: mononoki;
  font-size: 16px;
  margin-top: 5px;
}

.score-header .score-value {
  font-weight: 800;
  color: var(--secondary);
  margin-top: 6px;
  font-size: 18px;
}

.score-header .visualizer a {
  color: #cfd8dc;
  margin-top: 6px;
}

.score-header .visualizer .logo {
  vertical-align: sub;
  width: 21px;

  /* https://codepen.io/sosuke/pen/Pjoqqp */
  filter: invert(99%) sepia(36%) saturate(748%) hue-rotate(170deg) brightness(93%) contrast(84%);
}

.check {
  display: flex;
  height: 26px;
  align-items: center;
  cursor: pointer;
  flex-wrap: wrap;
  white-space: initial;
  overflow: hidden;
}

.check.visible {
  height: auto;
}

.check::before {
  content: '▶';
  padding: 4px;
  width: 20px;
  text-align: center;
  font-size: 11px;
}

.check.visible::before {
  content: '▼';
}

.check:hover {
  background: #3722af;
}

.check .info {
  flex: 1 1 100%;
  margin-left: 28px;
  visibility: hidden;
  font-size: 14px;
}

.check .info.visible {
  visibility: visible;
}

.check .info strong {
  font-weight: 500;
}

.check .description,
.check .reason,
.check .detail {
  margin-bottom: 10px;
  overflow-wrap: break-word;
}

.check .detail {
  font-size: small;
  margin-bottom: 6px;
}

.name,
.score {
  height: 26px;
  line-height: 26px;
  font-size: 16px;
}

.name {
  font-weight: 500;
  color: #BBDEFB;
  font-family: system-ui;
}

.score {
  margin-left: auto;
  font-family: mononoki;
}

.help-dialog {
  display: flex;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 2px dashed #57e1bf4a;
  color: #9de157;
  letter-spacing: 0.5px;
  align-items: center;
}

.help-dialog> nsecure-icon {
  margin-right: 11px;
  font-size: 28px;
}

.help-dialog>p {
  font-size: 14px;
  font-style: italic;
}

.help-dialog>p b {
  background: #9de157;
  padding: 2px 5px;
  color: #000;
  border-radius: 4px;
  font-style: normal;
  font-weight: bold;
  cursor: pointer;
}

.help-dialog>p b:hover {
  background: var(--secondary);
}

.help-dialog>p a {
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
  font-weight: bold;
}
`];

  static properties = {
    repository: { type: String },
    expandedCheck: { state: true }
  };

  constructor() {
    super();
    this.repository = "";
    /** @type {string | null} */
    this.expandedCheck = null;
  }

  #scorecardTask = new Task(this, {
    task: async([repository], { signal }) => {
      this.expandedCheck = null;
      const [repoName, platform] = getVCSRepositoryPathAndPlatform(repository) ?? [];
      const data = repoName ? await fetchScorecardData(repoName, platform) : null;
      if (!signal.aborted) {
        this.dispatchEvent(new CustomEvent("scorecard-loaded", { detail: data }));
      }

      return data ? { data, link: getScorecardLink(repoName, platform) } : null;
    },
    args: () => [this.repository]
  });

  render() {
    return this.#scorecardTask.render({
      complete: (result) => {
        if (!result) {
          return nothing;
        }
        const { data, link } = result;
        const { package_info } = getI18n();
        const helpers = /** @type {Record<string, string>} */ (/** @type {unknown} */ (package_info.helpers));

        return html`
          <div class="help-dialog">
            <nsecure-icon name="info-circled"></nsecure-icon>
            <p>${helpers.openSsf} <a href="https://github.com/ossf/scorecard" target="_blank"
              rel="noopener noreferrer">${helpers.here}</a></p>
          </div>
          <div class="score-header">
            <span class="score-text">SCORE</span>
            <span class="score-value">${data.score}/10</span>
            <span class="visualizer">
              <a href=${link} target="_blank" rel="noopener noreferrer">
                <img src="ext-link.svg" class="logo"> OpenSSF Scorecard Monitor Visualizer
              </a>
            </span>
          </div>
          <div class="checks">${data.checks.map((check) => this.#renderCheck(check))}</div>
        `;
      }
    });
  }

  /**
   * @param {import("../../../../common/scorecard.js").ScorecardCheck} check
   */
  #renderCheck(check) {
    const expanded = this.expandedCheck === check.name;
    const toggle = () => {
      this.expandedCheck = expanded ? null : check.name;
    };

    return html`
      <div class="check ${expanded ? "visible" : ""}" @click=${toggle}>
        <span class="name">${check.name}</span>
        <div class="score">${Math.max(0, check.score || 0)}/10</div>
        <div class="info ${expanded ? "visible" : ""}">
          <div class="description">${check.documentation.short}</div>
          <div class="reason">
            <p><strong>Reasoning</strong></p>
            <span>${check.reason}</span>
          </div>
          ${(check.details ?? []).map((detail) => html`<div class="detail">${detail}</div>`)}
        </div>
      </div>
    `;
  }
}

customElements.define("package-scorecard", Scorecard);
