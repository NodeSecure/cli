import gravatarURL from "gravatar-url";

let activeLegendElement = null;

export function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return "0 B";
    }
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const id = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + " " + sizes[id];
}

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

export function createLink(url, text = null) {
    const aElement = document.createElement("a");
    aElement.rel = "noopener";
    aElement.target = "_blank";
    aElement.href = url;
    if (text !== null) {
        aElement.appendChild(document.createTextNode(text));
    }

    return aElement;
}

export function createTooltip(text, description) {
    const spanElement = createDOMElement("span", {
        classList: ["tooltiptext"], text: description
    });

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
    if (!("email" in desc) || typeof desc.email === "undefined" || desc.email === null) {
        imgEl.src = "/img/avatar-default.png";
    }
    else {
        imgEl.src = gravatarURL(desc.email);
        imgEl.onerror = () => {
            imgEl.src = "/img/avatar-default.png";
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

    legendDivElement.addEventListener("click", () => {
        if (activeLegendElement !== null) {
            activeLegendElement.classList.remove("active");
        }
        activeLegendElement = legendDivElement;
        activeLegendElement.classList.add("active");
        updateDescription(title);
    });

    return legendDivElement;
}

async function updateDescription(title) {
    const flagDescriptionElement = document.getElementById("flag-description");
    const description = await (await fetch(`flags/description/${title}`)).text();
    flagDescriptionElement.innerHTML = description;
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

// eslint-disable-next-line max-params
export function renderItemsList(node, items = [], onclick = null, handleHidden = false) {
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

export async function request(path, customHeaders = Object.create(null)) {
    const headers = {
        Accept: "application/json"
    };

    const raw = await fetch(path, {
        method: "GET",
        headers: Object.assign({}, headers, customHeaders)
    });

    return raw.json();
}

function authorRegex() {
    return /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm;
}

export function parseAuthor(str) {
    if (typeof str !== "string") {
        throw new TypeError("expected author to be a string");
    }

    if (!str || !/\w/.test(str)) {
        return {};
    }

    const match = authorRegex().exec(str);
    if (!match) {
        return {};
    }
    const author = Object.create(null);

    if (match[1]) {
        author.name = match[1];
    }

    for (let id = 2; id < match.length; id++) {
        const val = match[id] || "";

        if (val.includes("@")) {
            author.email = val;
        }
        else if (val.includes("http")) {
            author.url = val;
        }
    }

    return author;
}
