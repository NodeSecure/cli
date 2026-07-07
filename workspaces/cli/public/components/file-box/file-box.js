// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import "../icon/icon.js";

class FileBox extends LitElement {
  static styles = css`
.box-file-info {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-top: 2px solid #351ea7;
  border-left: 2px solid #351ea7;
  background: linear-gradient(to bottom, rgb(12 15 94 / 27%) 0%, rgb(0 0 0 / 0%) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#450c0f5e', endColorstr='#00000000', GradientType=0);
  border-radius: 4px;
  box-shadow: 1px 1px 10px rgb(18 101 109 / 10%);
}

.box-file-info+.box-file-info {
  margin-top: 10px;
}

.box-file-info>.box-header {
  display: flex;
  align-items: center;
  height: 20px;
  margin-bottom: 20px;
}

.box-file-info>.box-header>span {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  box-sizing: border-box;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: mononoki;
  font-weight: bold;
  text-shadow: 2px 2px 10px #000;
}

.box-file-info>.box-header>span.Critical {
  background: #d32f2f;
}

.box-file-info>.box-header>span.Warning {
  background: #f08e26;
}

.box-file-info>.box-header>span.Information {
  background: #0288d1ab;
}

.box-file-info>.box-header>.box-title {
  font-size: 18px;
  font-variant: small-caps;
  font-family: mononoki;
  color: #FFF;
  font-weight: bold;
  letter-spacing: 1px;
  text-decoration: none;
}

.box-file-info>.box-header>a:hover {
  text-decoration: underline;
  cursor: pointer;
}

.box-file-info>.box-header>.box-file {
  margin-left: auto;
  color: #B3E5FC;
  display: flex;
}

.box-file-info>.box-header>.box-file a {
  color: inherit;
  text-decoration: none;
}

.box-file-info>.box-header>.box-file a:hover {
  text-decoration: underline;
}

.box-file-info>.box-header>.box-file i {
  margin-right: 6px;
}
`;
  static properties = {
    title: { type: String },
    fileName: { type: String },
    childs: { type: Array },
    titleHref: { type: String },
    fileHref: { type: String },
    severity: { type: String }
  };

  constructor() {
    super();
    this.title = "";
    this.fileName = "";
    this.titleHref = "#";
    this.fileHref = null;
    this.severity = null;
  }

  render() {
    return html`
    <div class="box-file-info">
      <div class="box-header">
        ${when(
          this.severity,
          (severity) => html`
            <span class=${severity}>
              ${severity.charAt(0).toUpperCase()}
            </span>
          `,
          () => nothing
        )}

        ${when(
          this.titleHref,
          (titleHref) => html`
            <a class="box-title" href=${titleHref} target="_blank" rel="noopener noreferrer">
              ${this.title}
            </a>
          `,
          () => html`<span class="box-title">${this.title}</span>`
        )}

        <div class="box-file">
          <nsecure-icon style="margin-right:8px;" name="docs"></nsecure-icon>
          ${when(
            this.fileHref,
            (fileHref) => html`
              <a href=${fileHref} target="_blank" rel="noopener noreferrer">
                ${this.fileName}
              </a>
            `,
            () => html`<span>${this.fileName}</span>`
          )}
        </div>
      </div>
      <slot></slot>
    </div>
  `;
  }
}

customElements.define("file-box", FileBox);
