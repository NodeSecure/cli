// Import Internal Dependencies
import * as utils from "../../common/utils.js";
import { createExpandableSpan } from "../expandable/expandable.js";

export class Gauge {
  /**
   * @param {{ name: string, value: number, chips?: string[] }[]} data
   */
  constructor(
    data,
    options = {}
  ) {
    this.maxLength = options.maxLength ?? 8;

    this.data = data;
    this.length = data.reduce((prev, curr) => prev + curr.value, 0);
  }

  pourcentFromValue(value) {
    return Math.round((value / this.length) * 100);
  }

  createGaugeBar(usagePourcent) {
    const usageBar = utils.createDOMElement("div", {
      className: "usage"
    });
    usageBar.style.width = `${usagePourcent}%`;

    return utils.createDOMElement("div", {
      className: "gauge--bar",
      childs: [usageBar]
    });
  }

  * createChips(chips) {
    for (const text of chips) {
      yield utils.createDOMElement("div", {
        className: "chip",
        text
      });
    }
  }

  /**
   * @param {!string} text
   * @param {!number} value
   * @param {string[]} chips
   * @returns {HTMLDivElement}
   */
  createLine(
    text,
    value,
    chips
  ) {
    const columnsLines = [
      utils.createDOMElement("div", {
        className: "line--column",
        childs: [
          utils.createDOMElement("p", { className: "item-name", text }),
          this.createGaugeBar(this.pourcentFromValue(value)),
          utils.createDOMElement("span", { text: value })
        ]
      })
    ];
    if (chips !== null) {
      columnsLines.push(
        utils.createDOMElement("div", {
          classList: ["line--column", "border-bottom"],
          childs: [...this.createChips(chips)]
        })
      );
    }

    return utils.createDOMElement("div", {
      className: "line",
      childs: columnsLines
    });
  }

  render() {
    const childs = [];
    const hideItems = this.data.length > this.maxLength;

    for (let id = 0; id < this.data.length; id++) {
      const { name, value, link = null, chips = null } = this.data[id];
      if (value === 0) {
        continue;
      }

      const line = this.createLine(name, value, chips);
      if (hideItems && id >= this.maxLength) {
        line.classList.add("hidden");
      }
      if (link !== null) {
        line.classList.add("clickable");
        line.addEventListener("click", () => window.open(link, "_blank"));
      }

      childs.push(line);
    }

    if (hideItems) {
      childs.push(createExpandableSpan(this.maxLength));
    }

    return utils.createDOMElement("div", {
      className: "gauge",
      childs
    });
  }
}
