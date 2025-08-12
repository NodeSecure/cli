// Import Third-party Dependencies
import { LitElement, css, html } from "lit";
import { repeat } from "lit/directives/repeat.js";

// Import Internal Dependencies
import { selectLicenses } from "./view-model.js";
import { currentLang } from "../../../../common/utils.js";
import "../../../file-box/file-box.js";
import "../../../icon/icon.js";

class Licenses extends LitElement {
  static styles = css`
  .box-container-licenses {
   display: flex;
    flex-wrap: wrap;
  }

  .box-container-licenses>div {
    flex-grow: 1;
    flex-basis: 150px;
    height: 26px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    font-weight: 500;
    color: #D1C4E9;
    font-family: system-ui;
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
`;

  static properties = {
    package: { type: Object }
  };

  render() {
    const { licenses } = this.package.dependencyVersion;
    const unpkgRoot = this.package.links.unpkg.href;
    const { package_info } = window.i18n[currentLang()];

    return html`
    <div class="help-dialog">
      <nsecure-icon name="info-circled"></nsecure-icon>
      <p>
      ${package_info.helpers.spdx}
      <a href="https://spdx.dev/about/" target="_blank"
          rel="noopener noreferrer">${package_info.helpers.here}
      </a>
    </p>
    </div>
    ${repeat(
      selectLicenses(licenses, unpkgRoot),
      (license) => license,
      ({
        title,
        spdx,
        fileName,
        fileHref,
        titleHref
      }) => html`
        <file-box
          .title=${title}
          .file-name=${fileName}
          .title-href=${titleHref}
          .file-href=${fileHref}
        >
          <div class="box-container-licenses">
          ${repeat(
            spdx,
            (text) => text,
            (text) => html`
                <div>${text}</div>
            `
          )}
          </div>
        </file-box>
      `
    )}
  `;
  }
}

customElements.define("package-licenses", Licenses);
