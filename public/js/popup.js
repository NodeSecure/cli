// Import Third-party Dependencies
import { locationToString } from "@nodesecure/utils";
import List from "list.js";

// Import Internal Dependencies
import * as utils from "./utils.js";

// CONSTANTS
const kLoadingMessage = "Loading ...";

function licenseModal(clone, options) {
    const { licenses, selectedNode } = options;
    if (licenses === "unkown license") {
        return;
    }

    const tbody = clone.querySelector("#licenses-table tbody");
    for (const license of selectedNode.license.licenses) {
        for (let id = 0; id < license.uniqueLicenseIds.length; id++) {
            const name = license.uniqueLicenseIds[id];
            const link = Reflect.has(license.spdxLicenseLinks, id) ?
                license.spdxLicenseLinks[id] : license.spdxLicenseLinks[0];

            utils.createLicenseLine(tbody, license, { name, link });
        }
    }
}

function getLineFromFile(code, location) {
    const [[startLine]] = location;
    const lines = code.split('\n');

    return lines[startLine - 1];
}

async function fetchCodeLine(event, url, location, cache, lineId) {
    const target = document.getElementById('tooltip');
    target.style.visibility = 'visible';

    if (cache.has(lineId)) {
        target.innerText = cache.get(lineId);
        event.stopPropagation();
        return;
    }

    target.innerText = kLoadingMessage;
    const code = await fetch(url).then((response) => response.text());

    target.innerText = code.length ? getLineFromFile(code, location): "Line not found ...";
    cache.set(lineId, target.innerText);
    event.stopPropagation();
}

function handleOutsideTooltipClick({ target }) {
    const tooltip = document.getElementById('tooltip');

    if (!tooltip) {
        return;
    }

    if ((tooltip.innerHTML && tooltip.innerHTML !== kLoadingMessage) && !tooltip.contains(target) && tooltip.style.visibility === "visible") {
        tooltip.style.visibility = "hidden";
        tooltip.innerHTML = "";
    }
}

function warningModal(clone, options) {
    const { name, version, npmHomePageURL, homepage, warnings } = options;
    const cache = new Map();

    const openLink = (link) => {
        return () => window.open(link).focus();
    }
    const unpkgRootURL = `https://unpkg.com/${name}@${version}/`;
    const homePageBtn = clone.getElementById("warning-link-homepage");
    homePageBtn.addEventListener("click", openLink(homepage));
    homePageBtn.querySelector("span").textContent = homepage;
    clone.getElementById("warning-link-npm").addEventListener("click", openLink(npmHomePageURL));
    clone.getElementById("warning-link-unpkg").addEventListener("click", openLink(unpkgRootURL));
    document.addEventListener("click", handleOutsideTooltipClick);

    const tbody = clone.querySelector("#warnings-table tbody");
    for (const { kind, file, value = null, location } of warnings) {
        const line = tbody.insertRow(0);
        const lineId = Math.random().toString(36).slice(2);
        const unpkgFile = `${unpkgRootURL}${file}`;

        const kindCell = line.insertCell(0)
        kindCell.classList.add("type");
        kindCell.appendChild(document.createTextNode(kind));

        const fileCell = line.insertCell(1);
        fileCell.addEventListener("click", () => {
            window.open(`${unpkgRootURL}${file}`, "_blank").focus();
        });
        fileCell.classList.add("clickable");
        fileCell.classList.add("file");
        fileCell.appendChild(document.createTextNode(file));

        const errorCell = line.insertCell(2);
        errorCell.classList.add("highlight");
        errorCell.classList.add("msg");
        if (value !== null) {
            errorCell.classList.add("clickable");
            errorCell.appendChild(document.createTextNode(value));
            errorCell.addEventListener("click", () => utils.copyToClipboard(value));
        }

        const positionCell = line.insertCell(3);
        positionCell.classList.add("position");
        if (kind === "encoded-literal") {
            const text = location.map((loc) => locationToString(loc)).join(" // ");
            positionCell.appendChild(document.createTextNode(text));
        }
        else {
            positionCell.appendChild(document.createTextNode(locationToString(location)));
        }

        const inspectCell = line.insertCell(4);
        inspectCell.innerHTML = "🔬";
        inspectCell.classList.add("inspect");
        if (!file.includes(".min") && kind !== "short-identifiers" && kind !== "obfuscated-code") {
            const currLocation = kind === "encoded-literal" ? location[0] : location;
            inspectCell.addEventListener("click", (event) => fetchCodeLine(event, unpkgFile, currLocation, cache, lineId));
        }
    }

    setTimeout(() => {
        new List("warnings-container", { valueNames: ["type", "file", "msg", "position"] });
    }, 1);
}

export function openLicenseModal(options = {}) {
    return () => window.toggleModal("popup-license", (clone) => licenseModal(clone, options));
}

export function openWarningsModal(options = {}) {
    return () => window.toggleModal("popup-warning", (clone) => warningModal(clone, options));
}
