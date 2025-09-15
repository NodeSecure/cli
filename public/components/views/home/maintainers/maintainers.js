// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";
import { repeat } from "lit/directives/repeat.js";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import "../../../expandable/expandable.js";
import { EVENTS } from "../../../../core/events.js";
import "../../../icon/icon.js";
import avatarURL from "../../../../img/avatar-default.png";

export class Maintainers {
  static whois(name, email) {
    const childs = [
      utils.createDOMElement("p", { text: name })
    ];
    if (typeof email === "string") {
      childs.push(utils.createDOMElement("span", { text: email }));
    }

    return utils.createDOMElement("div", {
      className: "whois", childs
    });
  }

  constructor(secureDataSet, nsn, options = {}) {
    const { maximumMaintainers = 5 } = options;

    this.secureDataSet = secureDataSet;
    this.nsn = nsn;
    this.maximumMaintainers = maximumMaintainers;
  }

  render() {
    const authors = this.#highlightContacts([...this.secureDataSet.authors.entries()]
      .sort((left, right) => right[1].packages.size - left[1].packages.size));

    document.getElementById("authors-count").innerHTML = authors.length;
    const maintainers = document.querySelector(".home--maintainers");
    this.generate(authors, maintainers);
  }

  #highlightContacts(authors) {
    const highlightedAuthors = authors
      .filter(([_, contact]) => this.secureDataSet.isHighlighted(contact));

    const authorsRest = authors.filter(([_, contact]) => !this.secureDataSet.isHighlighted(contact));

    return [...highlightedAuthors, ...authorsRest];
  }

  generate(authors, maintainers) {
    const fragment = document.createDocumentFragment();
    const hideItems = authors.length > this.maximumMaintainers;

    for (let id = 0; id < authors.length; id++) {
      const [name, data] = authors[id];
      if (typeof name === "undefined") {
        continue;
      }
      const { packages, email, url = null } = data;

      const hasURL = typeof url === "string";
      const person = utils.createDOMElement("div", {
        className: "person",
        childs: [
          utils.createAvatarImageElementForAuthor(data),
          Maintainers.whois(name, email),
          hasURL ? utils.createDOMElement("i", { className: "icon-link" }) : null,
          utils.createDOMElement("div", {
            className: "packagescount",
            childs: [
              utils.createDOMElement("i", { className: "icon-cube" }),
              utils.createDOMElement("p", { text: packages.size })
            ]
          })
        ]
      });
      if (this.secureDataSet.isHighlighted(data)) {
        person.classList.add("highlighted");
      }
      if (hideItems && id >= this.maximumMaintainers) {
        person.classList.add("hidden");
      }
      person.addEventListener("click", () => {
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
      });

      fragment.appendChild(person);
    }

    maintainers.appendChild(fragment);
    if (hideItems) {
      const expandableSpan = document.createElement("expandable-span");
      expandableSpan.onToggle = (expandable) => utils.toggle(expandable, maintainers, this.maximumMaintainers);

      maintainers.appendChild(expandableSpan);
    }
  }
}

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

.maintainers--popup>.header>.avatar>img {
  width: 80px;
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

        return `${name} @${version} `;
      });

    return html`
  <div class="maintainers--popup ${this.theme}">
    <div class="header">
      <div class="avatar">
      ${when(
          this.data.npmAvatar,
          () => html`<img src="https://www.npmjs.com/${this.data.npmAvatar}"
              @error=${(e) => {
                e.currentTarget.src = avatarURL;
              }}></img>`,
          () => html`<img src="https://unavatar.io/${this.data.email}"
               @error=${(e) => {
                  e.currentTarget.src = avatarURL;
                }}></img>`
        )
      }
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
            const closestNode = nodeIds
              .map((id) => {
                return { id, pos: this.nsn.network.getPosition(id) };
              })
              .reduce(
                (a, b) => (utils.vec2Distance(origin, a.pos) < utils.vec2Distance(origin, b.pos) ? a : b)
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
