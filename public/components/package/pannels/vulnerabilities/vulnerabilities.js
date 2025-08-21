// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";
import { repeat } from "lit/directives/repeat.js";

// Import Internal Dependencies
import { EVENTS } from "../../../../core/events.js";
import "../../../icon/icon.js";

class Vulnerabilities extends LitElement {
  static styles = css`
p {
  margin: 0;
}

.vuln-strategy {
  display: flex;
  flex-direction: column;
  height: 60px;
  margin-bottom: 15px;
  justify-content: center;
}

.vuln-strategy>div {
  display: flex;
  justify-content: center;
  align-items: center;
}

.vuln-strategy>div+div {
  margin-top: 5px;
}

.vuln-strategy img {
  width: 40px;
  margin-right: 10px;
}

.vuln-strategy .strategy {
  color: #bbb;
  font-size: 13px;
  font-family: system-ui;
  letter-spacing: 1px;
}

.vuln-strategy .strategy> nsecure-icon{
  margin-right: 4px;
  transform: translateY(2px);
}

.vuln-strategy .name {
  font-family: mononoki;
  font-variant: small-caps;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 2px 2px 10px #00000082;
}

.packages-vuln {
  display: flex;
  flex-direction: column;
}

.packages-vuln .vuln {
  border-top: 4px solid grey;
  border-left: 1px solid grey;
  border-right: 2px solid grey;
  border-bottom: 1px solid grey;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
  color: #FFF;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.packages-vuln .vuln+.vuln {
  margin-top: 10px;
}

.packages-vuln .vuln.critical {
  border-color: #B71C1C;
  background: linear-gradient(to right, rgb(63 0 6 / 53%) 0%, rgb(0 0 0 / 0%) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#873f0006', endColorstr='#00000000', GradientType=1);
}

.packages-vuln .vuln.high {
  border-color: rgb(249 104 37);
  background: linear-gradient(to right, rgb(53 38 0 / 65%) 0%, rgb(0 0 0 / 0%) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#a6352600', endColorstr='#00000000', GradientType=1);
}

.packages-vuln .vuln.medium,
.packages-vuln .vuln.moderate {
  border-color: #F9A825;
  background: linear-gradient(to right, rgb(65 66 0 / 65%) 0%, rgb(0 0 0 / 0%) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#a6414200', endColorstr='#00000000', GradientType=1);
}

.packages-vuln .vuln.info,
.packages-vuln .vuln.low {
  border-color: #2545f9;
  background: linear-gradient(to right, rgb(0 46 63 / 65%) 0%, rgb(0 0 0 / 0%) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#a6002e3f', endColorstr='#00000000', GradientType=1);
}

.packages-vuln .vuln>div {
  display: flex;
  height: 24px;
  align-items: center;
}

.packages-vuln .vuln .links {
  display: flex;
  align-items: center;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  margin-top: 5px;
}

.packages-vuln .vuln .links> nsecure-icon {
  whith: 16px;
  flex: 0 0 auto;
  margin-right: 5px;
  color: #00b8ead1;
  display: block;
}

.packages-vuln .vuln .links>a {
  flex: 1 1 auto;
  text-decoration: none;
  font-variant: all-small-caps;
  text-overflow: ellipsis;
}

.packages-vuln .vuln.critical .links>a {
  color: #ff9797d1;
}

.packages-vuln .vuln.high .links>a {
  color: #ffd6a1d1;
}

.packages-vuln .vuln.medium .links>a,
.packages-vuln .vuln.moderate .links>a {
  color: #ffeea1d1;
}

.packages-vuln .vuln.info .links>a,
.packages-vuln .vuln.low .links>a {
  color: #a1c8ffd1;
}

.packages-vuln .vuln>div .severity {
  width: 24px;
  height: inherit;
  margin-right: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: mononoki;
  font-weight: bold;
  text-shadow: 2px 2px 10px #000;
  color: #FFF;
  border-top: 2px solid #fbffde61;
  box-sizing: border-box;
}

.packages-vuln .vuln>div>p {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.packages-vuln .vuln>div>p.name {
  font-family: mononoki;
  font-size: 16px;
  color: #FFF;
}

.packages-vuln .vuln>div>span {
  margin-left: auto;
  background: #0000005c;
  padding: 4px 5px;
  margin-right: 10px;
  font-family: mononoki;
  font-size: 12px;
  border-radius: 4px;
}

.packages-vuln .vuln .description {
  height: auto;
  margin-top: 10px;
  text-shadow: 2px 2px 5px #00000054;
}

.vuln-strategy.dark ~ .packages-vuln .vuln .description {
  color: var(--dark-theme-secondary-lighter);
}

.packages-vuln .vuln>div .severity.critical {
  background: #B71C1C;
}

.packages-vuln .vuln>div .severity.high {
  background: rgb(249 104 37);
}

.packages-vuln .vuln>div .severity.medium,
.packages-vuln .vuln>div .severity.moderate {
  background: #F9A825;
}

.packages-vuln .vuln>div .severity.info,
.packages-vuln .vuln>div .severity.low {
  background: #2545f9;
}
`;

  static properties = {
    package: { type: Object },
    vulnerabilityStrategy: { type: String },
    theme: { type: String }
  };

  constructor() {
    super();
    this.settingsChanged = ({ detail: { theme } }) => {
      if (theme !== this.theme) {
        this.theme = theme;
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
    super.disconnectedCallback();
  }

  render() {
    const { vulnerabilities } = this.package.dependency;

    return html`
    <div class="${this.theme} vuln-strategy">
      <div>
        <p class="strategy">
      <nsecure-icon name="info-circled-filled"></nsecure-icon>
        strategy
      </p>
      </div>
      <div>
        ${when(this.vulnerabilityStrategy === "none",
            () => nothing,
            () => html`<img
              src="${this.vulnerabilityStrategy === "npm" ? "npm-icon.svg" : `${this.vulnerabilityStrategy}.png`}" class="logo">`
          )
        }
        <p class="name">${this.vulnerabilityStrategy}</p>
      </div>
    </div>
    <div class="packages-vuln">
    ${repeat(vulnerabilities,
        (vuln) => vuln,
        (vuln) => {
          const severity = vuln.severity ?? "info";
          const vulnerableSemver = vuln.vulnerableRanges[0] ?? "N/A";

          return html`<div class="vuln ${severity}">
          <div>
            <div class="severity ${severity}">
              ${severity.charAt(0).toUpperCase()}
            </div>
            <p class="name">${vuln.package}</p>
            <span>${vulnerableSemver}</span>
          </div>
          <div class="description">
            <p>${vuln.title}</p>
          </div>
          <div class="links">
              <nsecure-icon name="link"></nsecure-icon>
              <a href="${vuln.url}" target="_blank" rel="noopener noreferrer">
                ${vuln.url}
              </a>
          </div>
        </div>`;
        }
      )
    }
    </div>
`;
  }
}

customElements.define("package-vulnerabilities", Vulnerabilities);
