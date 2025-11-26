// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { currentLang } from "../../../../common/utils.js";
import "../../../bundlephobia/bundlephobia.js";
import "../../../items-list/items-list.js";
import { scrollbarStyle } from "../../../../common/scrollbar-style.js";

class Files extends LitElement {
  static styles = [scrollbarStyle, css`
  :host{
  display: block;
  overflow: hidden auto;
  height: calc(100vh - 315px);
  box-sizing: border-box;
  }

 .head-title {
  background: var(--primary-darker);
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--primary-lighter);
  border-radius: 2px 2px 0 0;
}

 .head-title.no-margin {
  margin-top: 0;
}

 .head-title>p {
  text-shadow: 1px 1px 5px rgb(20 20 20 / 50%);
  font-size: 18px;
  font-variant: small-caps;

  /* lowercase is needed with small-caps font variant */
  text-transform: lowercase;
  font-family: mononoki;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 0 10px;
}
`];
  static properties = {
    package: { type: Object }
  };

  render() {
    const { package_info: { title } } = window.i18n[currentLang()];
    const { name, version, composition } = this.package.dependencyVersion;

    return html`
      ${when(
        composition.extensions.length > 0,
        () => html`
      <div class="head-title no-margin">
        <p>${title.files_extensions}</p>
      </div>
      <items-list variant="line" .shouldShowEveryItems=${true} .items=${composition.extensions}></items-list>
    `,
        () => nothing
      )}

  ${when(
    composition.files.length > 0,
    () => html`
      <div class="head-title no-margin">
        <p>${title.files}</p>
      </div>
      <items-list
        .itemsToShowLength=${3}
        .items=${composition.files}
        .onClickItem=${this.openFile}
      ></items-list>
    `,
    () => nothing
  )}

  ${when(
    composition.required_files.length > 0,
    () => html`
      <div class="head-title">
        <p>${title.required_files}</p>
      </div>
      <items-list
        .itemsToShowLength=${3}
        .items=${composition.required_files}
        .onClickItem=${this.openFile}
      ></items-list>
    `,
    () => nothing
  )}

  ${when(
    composition.minified.length > 0,
    () => html`
      <div class="head-title">
        <p>${title.minified_files}</p>
      </div>
      <items-list
        .items=${composition.minified}
        .onClickItem=${this.openFile}
      ></items-list>
    `,
    () => nothing
  )}
    <bundle-phobia name=${name} version=${version}></bundle-phobia>
    `;
  }

  openFile = (fileName) => {
    const { name, version } = this.package.dependencyVersion;
    if (fileName === "../" || fileName === "./") {
      return;
    }

    const cleanedFile = fileName.startsWith("./") ? fileName.slice(2) : fileName;
    window
      .open(`https://unpkg.com/${name}@${version}/${cleanedFile}`, "_blank")
      .focus();
  };
}

customElements.define("package-files", Files);
