// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { selectVisibleItems } from "./view-model.js";
import "../expandable/expandable.js";

class ItemsList extends LitElement {
  static styles = css`
.list-item{
  display: flex;
  flex-wrap: wrap;
  margin-top: 5px;
  margin-bottom: 5px;
  margin-left: -5px;
  flex-direction: column;
  padding: 0;
  list-style: none;
}

.line {
  flex-direction: row;
}

.line > li {
flex-basis: 25px;
justify-content: start;
}

.list-item > li {
  padding-left: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  width: 96%;
  border-radius: 4px;
  font-size: 13px;
  letter-spacing: 0.7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: #CFD8DC;
  margin-left: 5px;
  margin-top: 5px;
  justify-content: flex-start;
}

.clickable:hover {
  background: var(--secondary-darker);
  color: #FFF;
  cursor: pointer;
}

`;

  static properties = {
    items: { type: Array },
    isClosed: { type: Boolean },
    itemsToShowLength: { type: Number },
    onClickItem: { type: Function },
    variant: { type: String }
  };

  constructor() {
    super();
    this.items = [];
    this.isClosed = true;
    this.itemsToShowLength = 5;
    this.onClickItem = null;
    this.variant = "column";
    this.shouldShowEveryItems = false;
  }

  render() {
    const hasExpandable = !this.shouldShowEveryItems && this.items.length > this.itemsToShowLength;

    return html`
    <ul class="list-item ${this.variant}">
    ${repeat(selectVisibleItems({
        items: this.items,
        isClosed: this.isClosed,
        itemsToShowLength: this.itemsToShowLength,
        shouldShowEveryItems: this.shouldShowEveryItems
      }),
      (item) => item,
      (item) => (typeof this.onClickItem === "function"
        ? html`<li class="clickable"  @click=${() => {
          this.onClickItem(item);
        }}>${item}</li>`
        : html`<li>${item}</li>`))
    }
    </ul>
    ${when(hasExpandable,
        () => html`<expandable-span .isClosed=${this.isClosed} .onToggle=${() => {
          this.isClosed = !this.isClosed;
        }}></expandable-span>`,
        () => nothing
      )
    }
`;
  }
}

customElements.define("items-list", ItemsList);
