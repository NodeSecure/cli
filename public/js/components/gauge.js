// Import Internal Dependencies
import * as utils from "../utils.js";

export class Gauge {
  /**
   * @param {[string, number][]} data
   */
  constructor(data, options = {}) {
    this.searchName = options.searchName ?? null;

    this.data = data;
    this.length = data.reduce((prev, curr) => prev + curr[1], 0);
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

  createLine(text, value) {
    return utils.createDOMElement("div", {
      className: "line",
      childs: [
        utils.createDOMElement("p", { className: "item-name", text }),
        this.createGaugeBar(this.pourcentFromValue(value)),
        utils.createDOMElement("span", { text: value })
      ]
    });
  }

  render() {
    const childs = [];
    const hideItemsLength = 8;
    const hideItems = this.data.length > hideItemsLength;

    for (let id = 0; id < this.data.length; id++) {
      const [name, value] = this.data[id];
      if (value === 0) {
        continue;
      }

      const line = this.createLine(name, value);
      // if (this.searchName !== null) {
      //   line.addEventListener("click", () => {
      //     console.log(name, value);
      //     window.searchbar.addNewSearchText(this.searchName, name);
      //   });
      // }

      if (hideItems && id >= hideItemsLength) {
        line.classList.add("hidden");
      }
      childs.push(line);
    }

    if (hideItems) {
      childs.push(utils.createExpandableSpan(hideItemsLength));
    }

    return utils.createDOMElement("div", {
      className: "gauge",
      childs
    });
  }
}
