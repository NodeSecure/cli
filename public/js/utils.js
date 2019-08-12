"use strict";

function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return "0 B";
    }
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const id = Math.floor(Math.log(bytes) / Math.log(1024));

    // eslint-disable-next-line
    return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + ' ' + sizes[id];
}

function createLiField(title, value, isLink = false) {
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
        liElement.appendChild(pElement);
    }

    return liElement;
}

function renderItemsList(node, items = []) {
    if (items.length === 0) {
        const previousNode = node.previousElementSibling;
        if (previousNode !== null) {
            previousNode.style.display = "none";
        }

        return;
    }

    const fragment = document.createDocumentFragment();
    for (const dep of items) {
        const span = document.createElement("span");
        span.appendChild(document.createTextNode(dep));
        fragment.appendChild(span);
    }
    node.appendChild(fragment);
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
