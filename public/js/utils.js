// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";
import { getJSON } from "@nodesecure/vis-network";

// Import static
import avatarURL from "../img/avatar-default.png";
import { portStore } from "../../src/http-server/context";

window.activeLegendElement = null;

export function createDOMElement(kind = "div", options = {}) {
    const { classList = [], childs = [], attributes = {}, text = null } = options;

    const el = document.createElement(kind);
    classList.forEach((name) => el.classList.add(name));
    childs.forEach((child) => el.appendChild(child));

    for (const [key, value] of Object.entries(attributes)) {
        el.setAttribute(key, value);
    }

    if (text !== null) {
        el.appendChild(document.createTextNode(String(text)));
    }

    return el;
}

export function createLink(href, text = null) {
    const attributes = {
        rel: "noopener", target: "_blank", href
    };

    return createDOMElement("a", { text, attributes });
}

export function createTooltip(text, description) {
    const spanElement = createDOMElement("span", { text: description });

    return createDOMElement("div", {
        classList: ["tooltip"], text, childs: [spanElement]
    });
}

export function createAvatar(name, desc) {
    const pElement = createDOMElement("p", {
        classList: ["count"], text: desc.count
    });
    const aElement = createLink(desc.url || "#");
    const divEl = createDOMElement("div", {
        classList: ["avatar"], childs: [pElement, aElement]
    });

    const imgEl = document.createElement("img");
    if (!("email" in desc) || typeof desc.email === "undefined" || desc.email === null || desc.email === "") {
        imgEl.src = `${avatarURL}`;
    }
    else {
        imgEl.src = `https://unavatar.now.sh/${desc.email}`;
        imgEl.onerror = () => {
            imgEl.src = `${avatarURL}`;
        };
    }
    imgEl.alt = name;
    aElement.appendChild(imgEl);

    return divEl;
}

export function createLegend(icon, title) {
    const slicedTitle = title.length > 20 ? `${title.slice(0, 20)}..` : title;
    const PElement = createDOMElement("p", { text: `${icon} ${slicedTitle}` });
    const legendDivElement = createDOMElement("div", {
        classList: ["platine-button-skin"], childs: [PElement]
    });

    legendDivElement.addEventListener("click", async () => {
        if (window.activeLegendElement !== null) {
            window.activeLegendElement.classList.remove("active");
        }
        window.activeLegendElement = legendDivElement;
        window.activeLegendElement.classList.add("active");

        const flagDescriptionElement = document.getElementById("flag-description");
        const description = await (await fetch(`flags/description/${title}`)).text();
        flagDescriptionElement.innerHTML = description;
    });

    return legendDivElement;
}

export function createLicenseLine(tbody, license, { name, link }) {
    const line = tbody.insertRow(0);

    line.insertCell(0).appendChild(createLink(link, name));
    line.insertCell(1).appendChild(document.createTextNode(license.spdx.osi ? "✔️" : "❌"));
    line.insertCell(2).appendChild(document.createTextNode(license.spdx.fsf ? "✔️" : "❌"));
    line.insertCell(3).appendChild(document.createTextNode(license.spdx.fsfAndOsi ? "✔️" : "❌"));
    line.insertCell(4).appendChild(document.createTextNode(license.spdx.includesDeprecated ? "✔️" : "❌"));
    line.insertCell(5).appendChild(document.createTextNode(license.from));
}

export function createLiField(title, value, options = {}) {
    const { isLink = false, modal = null } = options;

    const bElement = createDOMElement("b", { text: title });
    const liElement = createDOMElement("li", { childs: [bElement] });
    let elementToAppend;

    if (isLink) {
        const textValue = value.length > 26 ? `${value.slice(0, 26)}...` : value;
        elementToAppend = createLink(value, textValue);
    }
    else {
        elementToAppend = createDOMElement("p", { text: value });

        if (modal !== null) {
            elementToAppend.appendChild(createDOMElement("i", { classList: ["icon-eye"] }));

            liElement.classList.add("clickable");
            liElement.addEventListener("click", modal);
        }
    }
    liElement.appendChild(elementToAppend);

    return liElement;
}

export function createItemsList(node, items = [], onclick = null, handleHidden = false) {
    if (items.length === 0) {
        const previousNode = node.previousElementSibling;
        if (previousNode !== null) {
            previousNode.style.display = "none";
        }

        return;
    }

    const fragment = document.createDocumentFragment();
    for (let id = 0; id < items.length; id++) {
        const elem = items[id];
        if (elem.trim() === "") {
            continue;
        }

        const span = createDOMElement("span", { text: elem });
        if (handleHidden && id >= 5) {
            span.classList.add("hidden");
        }
        if (onclick !== null && typeof onclick === "function") {
            span.classList.add("clickable");
            span.addEventListener("click", (event) => onclick(event, elem));
        }
        fragment.appendChild(span);
    }

    if (handleHidden && items.length >= 5) {
        const iElement = createDOMElement("i", { classList: ["icon-plus-squared-alt"] });
        const pElement = createDOMElement("p", { text: "show more" });
        const span = createDOMElement("span", {
            classList: ["expandable"],
            childs: [iElement, pElement],
            attributes: { "data-value": "closed" }
        });

        span.addEventListener("click", function itemListClickAction() {
            const isClosed = this.getAttribute("data-value") === "closed";
            {
                const innerI = this.querySelector("i");
                innerI.classList.remove(isClosed ? "icon-plus-squared-alt" : "icon-minus-squared-alt");
                innerI.classList.add(isClosed ? "icon-minus-squared-alt" : "icon-plus-squared-alt");
            }
            this.querySelector("p").textContent = isClosed ? "show less" : "show more";
            this.setAttribute("data-value", isClosed ? "opened" : "closed");

            for (let id = 0; id < this.parentNode.childNodes.length; id++) {
                const node = this.parentNode.childNodes[id];
                if (node !== this) {
                    if (isClosed) {
                        node.classList.remove("hidden");
                    }
                    else if (id >= 5) {
                        node.classList.add("hidden");
                    }
                }
            }
        });

        fragment.appendChild(span);
    }
    node.appendChild(fragment);
}

export function copyToClipboard(str) {
    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
    }
};

export async function getBundlephobiaSize(name, version) {
  try {
    const port = portStore.getStore();
    console.log({ port });
    const {
      gzip, size, dependencySizes
    } = await getJSON(`http://localhost:${port}/bundle/${name}/${version}`);
    const fullSize = dependencySizes.reduce((prev, curr) => prev + curr.approximateSize, 0);

    document.querySelector(".size-gzip").textContent = prettyBytes(gzip);
    document.querySelector(".size-min").textContent = prettyBytes(size);
    document.querySelector(".size-full").textContent = prettyBytes(fullSize);

    return {
      gzip: prettyBytes(gzip),
      size: prettyBytes(size),
      fullSize: prettyBytes(fullSize)
    }
  }
  catch {
    return null;
  }
}
