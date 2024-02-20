// Import Internal Dependencies
import { createDOMElement, currentLang } from "../../common/utils";

export function createExpandableSpan(
  hideItemsLength,
  onclick = () => void 0
) {
  const lang = currentLang();
  const span = createDOMElement("span", {
    classList: ["expandable"],
    attributes: { "data-value": "closed" },
    childs: [
      createDOMElement("i", { className: "icon-plus-squared-alt" }),
      createDOMElement("p", { text: window.i18n[lang].home.showMore })
    ]
  });
  span.addEventListener("click", function itemListClickAction() {
    const isClosed = this.getAttribute("data-value") === "closed";
    {
      const innerI = this.querySelector("i");
      innerI.classList.remove(isClosed ? "icon-plus-squared-alt" : "icon-minus-squared-alt");
      innerI.classList.add(isClosed ? "icon-minus-squared-alt" : "icon-plus-squared-alt");
    }

    this.querySelector("p").textContent = isClosed ?
      window.i18n[lang].home.showLess : window.i18n[lang].home.showMore;
    this.setAttribute("data-value", isClosed ? "opened" : "closed");

    for (let id = 0; id < this.parentNode.childNodes.length; id++) {
      const node = this.parentNode.childNodes[id];
      if (node !== this) {
        if (isClosed) {
          node.classList.remove("hidden");
        }
        else if (id >= hideItemsLength) {
          node.classList.add("hidden");
        }
      }
    }
    onclick(this);
  });

  return span;
}
