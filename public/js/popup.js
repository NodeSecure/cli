import * as utils from "./utils.js";
import List from "list.js";

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

function locationToString(location) {
    const start = `${location[0][0]}:${location[0][1]}`;
    const end = `${location[1][0]}:${location[1][1]}`;

    return `[${start}] - [${end}]`;
}

function warningModal(clone, options) {
    const { name, version, npmHomePageURL, homepage, warnings } = options;

    const openLink = (link) => {
        return () => window.open(link).focus();
    }
    const unpkgRootURL = `https://unpkg.com/${name}@${version}/`;
    const homePageBtn = clone.getElementById("warning-link-homepage")
    homePageBtn.addEventListener("click", openLink(homepage));
    homePageBtn.querySelector("span").textContent = homepage;
    clone.getElementById("warning-link-npm").addEventListener("click", openLink(npmHomePageURL));
    clone.getElementById("warning-link-unpkg").addEventListener("click", openLink(unpkgRootURL));

    const tbody = clone.querySelector("#warnings-table tbody");
    for (const { kind, file, value = null, location } of warnings) {
        const line = tbody.insertRow(0);

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
        const positionCell = line.insertCell(3);
        positionCell.classList.add("position");
        if (value !== null) {
            errorCell.classList.add("clickable");
            errorCell.appendChild(document.createTextNode(value));
            errorCell.addEventListener("click", () => utils.copyToClipboard(value));
        }

        if (kind === "encoded-literal") {
            const text = location.map((loc) => locationToString(loc)).join(" // ");
            positionCell.appendChild(document.createTextNode(text));
        }
        else {
            positionCell.appendChild(document.createTextNode(locationToString(location)));
        }
    }

    setTimeout(() => {
        new List("warnings-container", { valueNames: ["type", "file", "msg", "position"] });
    }, 1);
}

export function openLicenseModal(options = {}) {
    return () => window.toggleModal("popup-license", (clone) => licenseModal(clone, options))
}

export function openWarningsModal(options = {}) {
    return () => window.toggleModal("popup-warning", (clone) => warningModal(clone, options))
}
