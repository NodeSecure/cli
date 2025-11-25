// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import "../../../expandable/expandable.js";
import { EVENTS } from "../../../../core/events.js";
import "../../../icon/icon.js";
import "../../../npm-avatar/npm-avatar.js";

export class Maintainers extends LitElement {
  static styles = css`

.module {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.title{
  height: 34px;
  display: flex;
  background: rgb(55 34 175);
  background: linear-gradient(-45deg, rgb(55 34 175 / 100%) 0%,
  rgb(55 34 175 / 100%) 48%, rgb(90 68 218 / 100%) 75%, rgb(90 68 218 / 100%) 100%);
  background: linear-gradient(-45deg, rgb(55 34 175 / 100%) 0%,
  rgb(55 34 175 / 100%) 48%, rgb(90 68 218 / 100%) 75%, rgb(90 68 218 / 100%) 100%);
  background: linear-gradient(135deg, rgb(55 34 175 / 100%) 0%,
  rgb(55 34 175 / 100%) 48%, rgb(90 68 218 / 100%) 75%, rgb(90 68 218 / 100%) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#3722af', endColorstr='#5a44da', GradientType=1);
  margin-bottom: 10px;
  box-sizing: border-box;
  border-radius: 4px;
  padding: 0 10px;
  align-items: center;
  font-family: mononoki;
  text-shadow: 1px 1px 10px #05a0ff6b;
}

 .users {
  width: fit-content;
  transform: scale(2);
  display: flex;
  padding: 0px;
  justify-content: center;
  align-items: center;
  margin: 0px;
  margin-right: 6px;
  margin-left: 15px;
  margin-top: 18px;
}

.link {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.link nsecure-icon {
  color: rgb(25, 118, 210);
}

.count{
width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FDD835;
  margin-left: 10px;
  color: #263238;
  font-size: 12px;
  font-weight: bold;
  padding: 4px;
}

 .home--maintainers {
  display: flex;
  flex-wrap: wrap;
  margin-left: -10px;
  margin-top: -10px;
}

.name {
  margin: 0px;
}

.home--maintainers>.person {
  height: 65px;
  flex-basis: 330px;
  background: linear-gradient(to bottom, rgb(255 255 255) 0%, rgb(245 252 255) 100%);
  display: flex;
  position: relative;
  box-sizing: border-box;
  border-radius: 4px;
  overflow: hidden;
  margin-left: 10px;
  margin-top: 10px;
  box-shadow: 1px 1px 4px 0 #271e792b;
  color: #546884;
  flex-grow: 1;
}

.dark .home--maintainers>.person {
  color: white;
  background: var(--dark-theme-primary-color);
}

.home--maintainers> .highlighted{
  background: linear-gradient(to bottom, rgb(230 240 250) 0%, rgb(220 235 245) 100%);
}

.dark .home--maintainers > .highlighted {
  background: linear-gradient(to right, rgb(11 3 31) 0%, rgb(46 10 10 / 80%) 100%);
}

.home--maintainers>.person:hover {
  border-color: var(--secondary-darker);
  cursor: pointer;
}

.home--maintainers>.person>nsecure-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  color: #1976D2;
  font-size: 18px;
}

.home--maintainers>.person>.whois {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 10px;
  font-size: 15px;
  font-family: mononoki;
  flex-grow: 1;
  margin-right: 10px;
}

.home--maintainers>.person>.whois>span {
  color: var(--secondary-darker);
  font-size: 14px;
  margin-top: 5px;
  font-family: monospace;
}

.home--maintainers>.person>div.packagescount {
  display: flex;
  align-items: center;
  font-family: mononoki;
  font-size: 18px;
  margin-right: 15px;
  flex-basis: 40px;
  flex-shrink: 0;
}

.home--maintainers>.person>div.packagescount>nsecure-icon {
  margin-right: 4px;
}
`;

  static properties = {
    secureDataSet: { type: Object },
    nsn: { type: Object },
    options: { type: Object },
    isClosed: { type: Boolean },
    theme: { type: String }
  };

  constructor() {
    super();
    this.isClosed = true;
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
    const authors = this.#highlightContacts([...this.secureDataSet.authors.entries()]
      .sort((left, right) => right[1].packages.size - left[1].packages.size));

    const { maximumMaintainers } = this.options;

    const hideItems = authors.length > maximumMaintainers;

    const numOfMaintainers = this.isClosed ? maximumMaintainers : authors.length;

    const visibleAuthors = hideItems ? authors.slice(0, numOfMaintainers) : authors;

    const i18n = window.i18n[utils.currentLang()];

    return html`
    <div class="module ${this.theme}">
        <div class="title">
          <nsecure-icon
          class="users"
          name="users"></nsecure-icon>
          <p>${i18n.home.maintainers}</p>
          <span class="count">${authors.length}</span>
        </div>
        <div class="content">
          <div class="home--maintainers">
            ${this.#generateMaintainers(visibleAuthors)}

        </div>
      ${when(hideItems,
        () => html`<expandable-span .isClosed=${this.isClosed} .onToggle=${() => {
          this.isClosed = !this.isClosed;
        }}></expandable-span>`,
        () => nothing)}
        </div>
      </div>
    `;
  }

  #generateMaintainers(authors) {
    return html`
    ${repeat(authors.filter(([name]) => typeof name != "undefined"),
        (author) => author,
        ([name, data]) => {
          const { packages, email, url = null, npmAvatar } = data;
          const personClasses = {
            person: true,
            highlighted: this.secureDataSet.isHighlighted(data)
          };

          return html`
            <div @click=${() => {
            // TODO: close package info?
              const popupMaintainer = document.createElement("popup-maintainer");
              popupMaintainer.data = data;
              popupMaintainer.theme = this.secureDataSet.theme;
              popupMaintainer.nsn = this.nsn;
              popupMaintainer.name = name;
              window.dispatchEvent(new CustomEvent(EVENTS.MODAL_OPENED, {
                detail: {
                  content: popupMaintainer
                }
              }));
            }}
              class="${classMap(personClasses)}">
            <npm-avatar
              avatar="${npmAvatar}"
              email="${email}"
              imgStyle="width: 65px; flex-shrink: 0;"
            ></npm-avatar>
            <div class="whois">
              <p class="name">${name}</p>
              ${when(
                typeof email === "string",
                () => html`<span class="email">${email}</span>`,
                () => nothing
              )}
            </div>
            ${when(
              typeof url === "string",
              () => html`
           <div class="link"><nsecure-icon name="link"></nsecure-icon></div>
            `
            )}
            <div class="packagescount">
              <nsecure-icon name="cube"></nsecure-icon>
              <p>${packages.size}</p>
          </div>
          </div>
      `;
        }
      )
    }
`;
  }

  #highlightContacts(authors) {
    const highlightedAuthors = authors
      .filter(([_, contact]) => this.secureDataSet.isHighlighted(contact));

    const authorsRest = authors.filter(([_, contact]) => !this.secureDataSet.isHighlighted(contact));

    return [...highlightedAuthors, ...authorsRest];
  }
}

customElements.define("nsecure-maintainers", Maintainers);

export class PopupMaintainer extends LitElement {
  static styles = css`
.maintainers--popup {
  display: flex;
  flex-direction: column;
  width: 500px;
  margin: 5px;
}

.maintainers--popup>.header {
  height: 80px;
  display: flex;
  flex-shrink: 0;
  margin-bottom: 10px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 25px;
}

.maintainers--popup>.header>.avatar {
  width: 80px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 2px 2px 6px 0 #00000012;
}

.maintainers--popup>.header>.informations {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  font-family: mononoki;
  margin: 0 10px;
}

.maintainers--popup>.header>.informations>p.name {
  color: #546884;
}

.dark >.header>.informations>p.name {
  color: white !important;
}

.maintainers--popup>.header>.informations>p.email {
  color: var(--secondary-darker);
  margin-top: 10px;
  font-family: monospace;
}

.dark >.header>.informations>p.email {
  color: var(--dark-theme-secondary-color) !important;
  opacity: 0.9 !important;
}

.maintainers--popup>.header>.icons {
  display: flex;
  align-items: center;
}

.maintainers--popup>.header>.icons>a,.maintainers--popup>.header>.icons>button {
  border:none;
  height: 40px;
  width: 40px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--secondary-darker);
  border-radius: 100%;
  color: #FFF;
  box-shadow: 2px 2px 6px 0 #00000012;
  margin-left: 10px;
}

.maintainers--popup>.header>.icons>a:hover,.maintainers--popup>.header>.icons>button:hover {
  cursor: pointer;
  background-color: var(--primary);
}

.maintainers--popup>.header>.icons>a > nsecure-icon,.maintainers--popup>.header>.icons>button > nsecure-icon{
  margin: 0;
  transform: translateX(1px);
}

.maintainers--popup>.separator {
  height: 2px;
  background: #d3d3d387;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dark >.separator {
  background: var(--dark-theme-secondary-color) !important;
}

.maintainers--popup>.separator>p {
  background: #f5f4f4;
  padding: 0 10px;
  font-family: roboto;
  font-weight: bold;
  letter-spacing: 1.2px;
  color: #255471;
}

.dark>.separator>p {
  background: #303263 !important;
  color: #3cbde5 !important;
}

.maintainers--popup>ul {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden auto;
  max-height: 240px;
  margin-top: 20px;
  margin-bottom: 10px;
  padding: 0;
}

.maintainers--popup>ul li {
  height: 36px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  background: linear-gradient(to right, rgb(221 229 251) 0%, rgb(255 255 255 / 0%) 100%);
  border-left: 2px solid #4480da;
  color: #234c99;
  border-radius: 4px;
  font-family: mononoki;
  flex-shrink: 0;
  font-size: 15px;
}

.dark>ul li {
  background: linear-gradient(to right, var(--dark-theme-primary-color) 0%, rgb(28 29 58 / 18.5%) 100%) !important;
  border: none !important;
  color: white !important;
}

.maintainers--popup>ul li>p{
  color: #234c99;
}

.dark>ul li>p{
  color: #9ca6b7 !important;
}

.maintainers--popup>ul li>span{
  color: #2470b3;
  margin-left: 10px;
}

.dark>ul li>span{
  color: var(--dark-theme-secondary-color) !important;
}

.maintainers--popup>ul li> button{
  border: none;
  margin-left: auto;
  margin-right: 13px;
  background: #4ab968;
  color: #FFF;
  border-radius: 100%;
  width: 26px;
  height: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 2px 2px 6px 0 #00000012;
}

.maintainers--popup>ul li> button nsecure-icon{
  margin: 0;
  transform: translateX(4px);
}

.maintainers--popup>ul li>button:hover {
  background: #4ab8b9;
  cursor: pointer;
}

.maintainers--popup>ul li+li {
  margin-top: 5px;
}
`;
  static properties = {
    name: { type: String },
    data: { type: Object },
    nsn: { type: Object },
    theme: { type: String }
  };

  constructor() {
    super();
    this.isLoading = false;
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
    const { url = null } = this.data;
    const { popup: { maintainer } } = window.i18n[utils.currentLang()];
    const packagesList = [...this.data.packages]
      .map((spec) => {
        const { name, version } = utils.parseNpmSpec(spec);

        return `${name}@${version}`;
      });

    return html`
  <div class="maintainers--popup ${this.theme}">
    <div class="header">
      <div class="avatar">
      <npm-avatar imgStyle="width: 80px;"
          avatar="${this.data.npmAvatar}"
          email="${this.data.email}"></npm-avatar>
      </div>
      <div class="informations">
        <p class="name">
          ${this.name}
        </p>
        ${when(
          typeof this.data.email === "string",
          () => html`<p class="email">${this.data.email}</p>`,
          () => nothing
        )}
      </div>
      <div class="icons">
        ${when(
          typeof url === "string",
          () => html`<a href="${url}" target="_blank" rel="noopener noreferrer">
        <nsecure-icon name="link"></nsecure-icon>
        </a>`,
          () => nothing
        )}
        <button class"button-icon" @click=${(e) => {
          e.stopPropagation();
          const nodeIds = [...this.nsn.findNodeIds(new Set(packagesList))];

          this.nsn.highlightMultipleNodes(nodeIds);
          window.locker.lock();
          window.dispatchEvent(new CustomEvent(EVENTS.MODAL_CLOSED));
          window.navigation.setNavByName("network--view");

          const currentSelectedNode = window.networkNav.currentNodeParams;
          const moveTo = currentSelectedNode === null || !nodeIds.includes(currentSelectedNode.nodes[0]);
          if (moveTo) {
            const origin = this.nsn.network.getViewPosition();
            const nodes = nodeIds
              .map((id) => {
                return { id, pos: this.nsn.network.getPosition(id) };
              });
            const closestNode = nodes
              .reduce(
                (a, b) => (utils.vec2Distance(origin, a.pos) < utils.vec2Distance(origin, b.pos) ? a : b),
                nodes[0]
              );

            const scale = nodeIds.length > 3 ? 0.25 : 0.35;
            this.nsn.network.focus(closestNode.id, {
              animation: true,
              scale
            });
          }
        }}>
      <nsecure-icon name="globe"></nsecure-icon>
        </button >
      </div >
    </div >
    <div class="separator">
      <p>${maintainer.intree}</p>
    </div>
    <ul class="maintainers--packages">
    ${repeat(
        this.data.packages,
        (spec) => spec,
        (spec) => {
          const { name, version } = utils.parseNpmSpec(spec);

          return html`<li>
            <p>${name}</p>
        <span>v${version}</span>
        <button class"button-icon" @click=${(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent(EVENTS.MODAL_CLOSED));
          window.navigation.setNavByName("network--view");
          setTimeout(() => this.nsn.focusNodeByNameAndVersion(name, version), 25);
        }}>
            <nsecure-icon name="right-open-big"></nsecure-icon>
            </button >
          </li >`;
        }
      )
    }
    </ul>
  </div >
  `;
  }
}

customElements.define("popup-maintainer", PopupMaintainer);
