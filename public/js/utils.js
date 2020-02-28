"use strict";

let activeLegendElement = null;

function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return "0 B";
    }
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const id = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + " " + sizes[id];
}

function createTooltip(icon, description) {
    const divElement = document.createElement("div");
    divElement.classList.add("tooltip");
    divElement.appendChild(document.createTextNode(icon));

    const spanElement = document.createElement("span");
    spanElement.classList.add("tooltiptext");
    spanElement.appendChild(document.createTextNode(description));

    divElement.appendChild(spanElement);

    return divElement;
}

function createAvatar(name, desc) {
    const divEl = document.createElement("div");
    divEl.classList.add("avatar");

    const pElement = document.createElement("p");
    pElement.classList.add("count");
    pElement.appendChild(document.createTextNode(desc.count));
    divEl.appendChild(pElement);

    const aElement = document.createElement("a");
    aElement.target = "_blank";
    aElement.href = desc.url || "#";

    const imgEl = document.createElement("img");
    if (!("email" in desc) || typeof desc.email === "undefined" || desc.email === null) {
        imgEl.src = "/img/avatar-default.png";
    }
    else {
        const hash = md5(desc.email);
        imgEl.src = `https://gravatar.com/avatar/${hash}?&d=404`;
        imgEl.onerror = () => {
            imgEl.src = "/img/avatar-default.png";
        };
    }
    imgEl.alt = name;

    aElement.appendChild(imgEl);
    divEl.appendChild(aElement);

    return divEl;
}

function createLegend(icon, title) {
    const slicedTitle = title.length > 20 ? `${title.slice(0, 20)}..` : title;
    const legendDivElement = document.createElement("div");

    legendDivElement.classList.add("platine-button-skin");
    legendDivElement.addEventListener("click", function legendClicked() {
        if (activeLegendElement !== null) {
            activeLegendElement.classList.remove("active");
        }
        activeLegendElement = legendDivElement;
        activeLegendElement.classList.add("active");
        updateDescription(title);
    });

    const PElement = document.createElement("p");
    PElement.appendChild(document.createTextNode(`${icon} ${slicedTitle}`));
    legendDivElement.appendChild(PElement);

    return legendDivElement;
}

function createLicenseLine(tbody, license, { name, link }) {
    const line = tbody.insertRow(0);

    {
        const aElement = document.createElement("a");
        aElement.setAttribute("target", "_blank");
        aElement.href = link;
        aElement.textContent = name;
        line.insertCell(0).appendChild(aElement);
    }
    line.insertCell(1).appendChild(document.createTextNode(license.spdx.osi ? "✔️" : "❌"));
    line.insertCell(2).appendChild(document.createTextNode(license.spdx.fsf ? "✔️" : "❌"));
    line.insertCell(3).appendChild(document.createTextNode(license.spdx.fsfAndOsi ? "✔️" : "❌"));
    line.insertCell(4).appendChild(document.createTextNode(license.spdx.includesDeprecated ? "✔️" : "❌"));
    line.insertCell(5).appendChild(document.createTextNode(license.from));
}

function createLiField(title, value, options = {}) {
    const { isLink = false, modal = null } = options;

    const liElement = document.createElement("li");
    const bElement = document.createElement("b");
    bElement.appendChild(document.createTextNode(title));

    liElement.appendChild(bElement);
    if (isLink) {
        const aElement = document.createElement("a");
        aElement.href = value;
        aElement.target = "_blank";

        const textValue = value.length > 26 ? `${value.slice(0, 26)}...` : value;
        aElement.appendChild(document.createTextNode(textValue));
        liElement.appendChild(aElement);
    }
    else {
        const pElement = document.createElement("p");
        pElement.appendChild(document.createTextNode(value));

        if (modal !== null) {
            const iElement = document.createElement("i");
            iElement.classList.add("icon-eye");
            pElement.appendChild(iElement);

            liElement.classList.add("clickable");
            liElement.addEventListener("click", modal);
        }
        liElement.appendChild(pElement);
    }

    return liElement;
}

// eslint-disable-next-line max-params
function renderItemsList(node, items = [], onclick = null, handleHidden = false) {
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

        const span = document.createElement("span");
        if (handleHidden && id >= 5) {
            span.classList.add("hidden");
        }
        if (onclick !== null && typeof onclick === "function") {
            span.classList.add("clickable");
            span.addEventListener("click", (event) => onclick(event, elem));
        }
        span.appendChild(document.createTextNode(elem));
        fragment.appendChild(span);
    }
    node.appendChild(fragment);

    if (handleHidden && items.length >= 5) {
        const span = document.createElement("span");
        span.setAttribute("data-value", "closed");
        span.addEventListener("click", function spanClick() {
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
        span.classList.add("expandable");

        const iElement = document.createElement("i");
        iElement.classList.add("icon-plus-squared-alt");
        span.appendChild(iElement);

        const pElement = document.createElement("p");
        pElement.appendChild(document.createTextNode("show more"));
        span.appendChild(pElement);

        node.appendChild(span);
    }
}

async function request(path, customHeaders = Object.create(null)) {
    const headers = {
        Accept: "application/json"
    };

    const raw = await fetch(path, {
        method: "GET",
        headers: Object.assign({}, headers, customHeaders)
    });

    return raw.json();
}

async function updateDescription(title) {
    const flagDescriptionElement = document.getElementById("flag-description");
    const description = await (await fetch(`flags/description/${title}`)).text();
    flagDescriptionElement.innerHTML = description;
}

function authorRegex() {
    return /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm;
}

function parseAuthor(str) {
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
