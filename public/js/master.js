"use strict";

// Dependencies
import prettyBytes from "pretty-bytes";
import * as utils from "./utils.js";
import * as popup from "./popup.js";
import { Network, DataSet } from "vis-network/standalone/esm/index.js";
import SearchBar from "./searchbar.js";
import { getManifestEmoji } from "@nodesecure/flags/web";

// CONSTANTS (for nodes colors)
const C_MAIN = "#01579B";
const C_INDIRECT = "rgba(100, 200, 200, 0.30)";
const C_WARN = "rgba(210, 115, 115, 0.30)";
const C_NORMAL = "rgba(150, 200, 200, 0.15)";
const C_SELECTED = "rgba(170, 100, 200, 0.50)";
const C_TRS = "rgba(150, 150, 150, 0.02)";
let toggleModal;

const kFlagsEmojis = Object.fromEntries(getManifestEmoji());
const networkGraphOptions = {
    nodes: {
        mass: 6,
        shape: "box",
        size: 5,
        font: {
            face: "Roboto",
            vadjust: 1,
            size: 38,
            color: "#ECEFF1",
            bold: {
                face: "Roboto",
                color: "#F9FBE7"
            }
        },
        margin: 14,
        shadow: {
            enabled: true,
            color: "rgba(20, 20, 20, 0.2)"
        }
    },
    edges: {
        arrows: "from",
        hoverWidth: 3,
        selectionWidth: 3,
        width: 2
    },
    physics: {
        forceAtlas2Based: {
            gravitationalConstant: -35,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18
        },
        maxVelocity: 150,
        solver: "forceAtlas2Based",
        timestep: 0.35,
        stabilization: {
            enabled: true,
            iterations: 1000
        }
    }
};

function getColor(id, flags) {
    if (id === 0) {
        return C_MAIN;
    }
    else if (flags.includes("hasWarnings") || flags.includes("hasMinifiedCode")) {
        return C_WARN;
    }
    else if (flags.includes("hasIndirectDependencies")) {
        return C_INDIRECT;
    }

    return C_NORMAL;
}

function getEmojiFromFlags(flags) {
    return [...flags]
        .map((title) => kFlagsEmojis[title] ?? null)
        .filter((value) => value !== null)
        .reduce((acc, cur) => `${acc} ${cur}`, "");
}

document.addEventListener("DOMContentLoaded", async() => {
    const networkLoaderElement = document.getElementById("network-loader");
    const networkElement = document.getElementById("network-graph");
    const dataListElement = document.getElementById("package-list");
    const modal = document.querySelector(".modal");

    document.getElementById("legend_popup_btn").addEventListener("click", () => {
        toggleModal("popup-legends");
        const legendsFlagsFragment = document.createDocumentFragment();
        for (const { title, emoji } of Object.values(FLAGS)) {
            legendsFlagsFragment.appendChild(utils.createLegend(emoji, title));
        }
        legendsFlagsFragment.appendChild(utils.createLegend("🎭", "isDuplicate"));
        document.getElementById("flag-legends").appendChild(legendsFlagsFragment);
    });
    document.querySelector(".close-button").addEventListener("click", () => toggleModal());
    modal.addEventListener("click", () => {
        if (event.target === modal) {
            toggleModal();
        }
    });

    // Hydrate nodes & edges with the data
    const nodesDataArr = [];
    const edgesDataArr = [];
    const linker = new Map();

    const [data, FLAGS] = await Promise.all([
        utils.getJSON("/data"), utils.getJSON("/flags")
    ]);
    const dataEntries = Object.entries(data.dependencies);

    let indirectDependenciesCount = 0;
    let totalSize = 0;
    let highlightActive = false;
    const licensesCount = { Unknown: 0 };
    const extensionsCount = {};
    const authorsList = new Map();

    // Setup warnings
    if (data.warnings.length === 0) {
        document.getElementById("global_warnings").style.display = "none";
    }
    else {
        const fragment = document.createDocumentFragment();
        for (const text of data.warnings) {
            const pElement = utils.createDOMElement("p", { text });
            fragment.appendChild(utils.createDOMElement("div", { classList: ["warning"], childs: [pElement] }));
        }

        document.querySelector("#global_warnings > p").textContent = data.warnings.length;
        document.getElementById("warnings_box").appendChild(fragment);
    }

    // Generate network!
    for (const [packageName, descriptor] of dataEntries) {
        const { metadata, vulnerabilities, versions } = descriptor;

        for (const currVersion of versions) {
            const opt = descriptor[currVersion];
            const { id, usedBy, flags, size, license, author, composition } = opt;
            opt.name = packageName;
            opt.version = currVersion;
            opt.hidden = false;

            for (const extName of composition.extensions) {
                if (extName === "") {
                    continue;
                }
                extensionsCount[extName] = Reflect.has(extensionsCount, extName) ? ++extensionsCount[extName] : 1;
            }

            if (typeof license === "string") {
                licensesCount.Unknown++;
            }
            else {
                for (const licenseName of license.uniqueLicenseIds) {
                    licensesCount[licenseName] = Reflect.has(licensesCount, licenseName) ? ++licensesCount[licenseName] : 1;
                }
            }
            handleAuthor(author);

            if (flags.includes("hasIndirectDependencies")) {
                indirectDependenciesCount++;
            }
            totalSize += size;
            const flagStr = getEmojiFromFlags(flags);
            {
                const content = `<p>${flagStr.replace(/\s/g, "")} ${packageName}</p><b>${currVersion}</b>`;
                dataListElement.insertAdjacentHTML("beforeend", `<div class="package hide" data-value="${id}">${content}</div>`);
            }
            const label = `${packageName}@${currVersion}${flagStr}\n<b>[${prettyBytes(size)}]</b>`;
            const color = getColor(id, flags);

            linker.set(Number(id), opt);
            nodesDataArr.push({ id, label, color, font: { multi: "html" } });

            for (const [name, version] of Object.entries(usedBy)) {
                edgesDataArr.push({ from: id, to: data.dependencies[name][version].id });
            }
        }
    }

    {
        const { name, version } = linker.get(0);
        const nameElement = document.getElementById("main-project-name");
        if (name.length > 17) {
            nameElement.style["font-size"] = "16px";
        }
        nameElement.textContent = name;
        document.getElementById("main-project-version").textContent = `version ${version}`;
        document.querySelector(".current-project").addEventListener("click", () => {
            network.emit("click", { nodes: [0] });
        });
    }
    networkElement.click();

    // Setup global stats
    document.getElementById("total-packages").innerHTML = dataEntries.length;
    document.getElementById("indirect-dependencies").innerHTML = indirectDependenciesCount;
    document.getElementById("total-size").innerHTML = prettyBytes(totalSize);
    {
        const licenseFragment = document.createDocumentFragment();
        const licensesEntries = [...Object.entries(licensesCount)].sort(([, left], [, right]) => right - left);

        for (const [licenseName, licenseCount] of licensesEntries) {
            if (licenseCount === 0) {
                continue;
            }
            const divElement = utils.createDOMElement("div", {
                classList: ["license", "stat-case"],
                text: `${licenseName} (${licenseCount})`
            });
            licenseFragment.appendChild(divElement);
        }
        document.getElementById("license-counts").appendChild(licenseFragment);
    }

    {
        const extFragment = document.createDocumentFragment();
        const extEntries = [...Object.entries(extensionsCount)].sort(([, left], [, right]) => right - left);

        for (const [extName, extCount] of extEntries) {
            const divElement = utils.createDOMElement("div", {
                classList: ["ext", "stat-case"],
                text: `${extName} (${extCount})`
            });
            extFragment.appendChild(divElement);
        }
        document.getElementById("extensions-counts").appendChild(extFragment);
    }

    {
        document.getElementById("stat-maintainers-title").textContent = `${authorsList.size} Maintainers`;
        const authorsFragment = document.createDocumentFragment();
        for (const [name, desc] of authorsList.entries()) {
            authorsFragment.appendChild(utils.createAvatar(name, desc));
        }
        document.getElementById("maintainers-list").appendChild(authorsFragment);
    }

    // Create required DataSet for the Network Graph
    const nodes = new DataSet(nodesDataArr);
    const edges = new DataSet(edgesDataArr);

    // Initialize vis Network
    const network = new Network(networkElement, { nodes, edges }, networkGraphOptions);
    network.on("stabilizationIterationsDone", () => {
        networkLoaderElement.style.display = "none";
        network.stopSimulation();
        network.focus(0, { animation: true, scale: 0.35 });
    });
    network.on("click", neighbourHighlight);
    network.on("click", updateShowInfoMenu);
    network.stabilize(500);
    const bar = new SearchBar(network, linker);
    bar.allSearchPackages.forEach((element) => element.addEventListener("click", searchResultClick));

    function* searchForNeighbourIds(selectedNode) {
        const { name, version } = linker.get(selectedNode);
        for (const descriptor of Object.values(data.dependencies)) {
            for (const currVersion of descriptor.versions) {
                const { id, usedBy } = descriptor[currVersion];
                if (Reflect.has(usedBy, name) && usedBy[name] === version) {
                    yield* searchForNeighbourIds(id);
                    yield id;
                }
            }
        }
    }

    async function updateShowInfoMenu(params) {
        network.stopSimulation();
        const showInfoElem = document.getElementById("show-info");
        const packageInfoTemplate = document.getElementById("package-info");

        if (params.nodes.length === 0) {
            const template = document.getElementById("left-menu-desc");
            showInfoElem.innerHTML = "";
            showInfoElem.appendChild(document.importNode(template.content, true));

            return;
        }
        showInfoElem.innerHTML = "";

        const clone = document.importNode(packageInfoTemplate.content, true);
        const currentNode = params.nodes[0];
        const selectedNode = linker.get(Number(currentNode));
        const { name, version, author, flags, composition, warnings, usedBy } = selectedNode;
        const { metadata, versions, vulnerabilities } = data.dependencies[name];

        const btnShow = clone.getElementById("btn_showOrHide");
        const btnVuln = clone.getElementById("btn_vuln");
        {
            btnShow.innerHTML = "";
            const template = document.getElementById(selectedNode.hidden ? "show-children" : "hide-children");
            btnShow.appendChild(document.importNode(template.content, true));
        }

        if (metadata.dependencyCount === 0) {
            btnShow.classList.add("disabled");
        }
        else {
            btnShow.addEventListener("click", function showOrHide() {
                const currBtn = document.getElementById("btn_showOrHide");
                currBtn.classList.toggle("active");
                const hidden = !selectedNode.hidden;

                currBtn.innerHTML = "";
                const template = document.getElementById(hidden ? "show-children" : "hide-children");
                currBtn.appendChild(document.importNode(template.content, true));

                network.startSimulation();
                nodes.update([...searchForNeighbourIds(currentNode)].map((id) => ({ id, hidden })));
                selectedNode.hidden = !selectedNode.hidden;
            });
        }

        vulnerabilities.length === 0 && btnVuln.classList.add("disabled");
        {
            const nameElement = clone.querySelector(".name");
            if (name.length > 16) {
                nameElement.style["font-size"] = "18px";
            }
            nameElement.textContent = name;
        }
        clone.querySelector(".version").textContent = version;
        {
            const descElement = clone.querySelector(".desc");
            const desc = selectedNode.description.trim();
            if (desc === "") {
                descElement.style.display = "none";
            }
            else {
                descElement.textContent = desc;
                if (desc.length <= 60) {
                    descElement.style["text-align"] = "center";
                }
            }
        }

        let fAuthor = typeof author === "string" ? author : (author.name || "Unknown");
        fAuthor = fAuthor.length > 26 ? `${fAuthor.slice(0, 26)}...` : fAuthor;

        const lastUpdate = Intl.DateTimeFormat("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "numeric", minute: "numeric", second: "numeric"
        }).format(new Date(metadata.lastUpdateAt));

        {
            const npmHomePageURL = `https://www.npmjs.com/package/${name}/v/${version}`;
            const licenses = selectedNode.license === "unkown license" ?
                "unkown license" : selectedNode.license.uniqueLicenseIds.join(", ");
            const licenseModal = popup.openLicenseModal({ licenses, selectedNode });
            const warningsModal = popup.openWarningsModal({
                name, version, npmHomePageURL, homepage: metadata.homepage, warnings
            });

            const fieldsFragment = document.createDocumentFragment();
            fieldsFragment.appendChild(utils.createLiField("Author", fAuthor));
            fieldsFragment.appendChild(utils.createLiField("Size on (local) system", prettyBytes(selectedNode.size)));
            fieldsFragment.appendChild(utils.createLiField("Homepage", metadata.homepage || "N/A", { isLink: true }));
            fieldsFragment.appendChild(utils.createLiField("npm page", npmHomePageURL, { isLink: true }));
            fieldsFragment.appendChild(utils.createLiField("Last release (version)", metadata.lastVersion));
            fieldsFragment.appendChild(utils.createLiField("Last release (date)", lastUpdate));
            fieldsFragment.appendChild(utils.createLiField("Number of published releases", metadata.publishedCount));
            if (warnings.length > 0) {
                fieldsFragment.appendChild(document.createElement("hr"));
                fieldsFragment.appendChild(utils.createLiField("Warnings", warnings.length, { modal: warningsModal }));
            }
            fieldsFragment.appendChild(utils.createLiField("License", licenses, { modal: licenseModal }));
            clone.querySelector(".fields").appendChild(fieldsFragment);
        }

        {
            const flagsElement = clone.querySelector(".flags");
            const textContent = getEmojiFromFlags(flags);
            if (textContent === "") {
                flagsElement.style.display = "none";
            }
            else {
                const flagsFragment = document.createDocumentFragment();
                for (const icon of textContent) {
                    if (Reflect.has(FLAGS, icon)) {
                        flagsFragment.appendChild(utils.createTooltip(icon, FLAGS[icon].tooltipDescription));
                    }
                }
                flagsElement.appendChild(flagsFragment);
            }
        }

        {
            utils.createItemsList(clone.getElementById("nodedep"), composition.required_nodejs, (event, coreLib) => {
                window.open(`https://nodejs.org/dist/latest/docs/api/${coreLib}.html`, "_blank").focus();
            });

            // eslint-disable-next-line func-style
            const listener = (event, fileName) => {
                if (fileName === "../" || fileName === "./") {
                    return;
                }
                const cleanedFile = fileName.startsWith("./") ? fileName.slice(2) : fileName;
                window.open(`https://unpkg.com/${name}@${version}/${cleanedFile}`, "_blank").focus();
            };
            utils.createItemsList(clone.getElementById("extensions"), composition.extensions);
            utils.createItemsList(clone.getElementById("minifiedfiles"), composition.minified, listener, true);
            utils.createItemsList(clone.getElementById("unuseddep"), composition.unused);
            utils.createItemsList(clone.getElementById("missingdep"), composition.missing, null);

            const graphDepListener = (event, packageName) => {
                let wantedId = null;
                for (const [id, opt] of linker) {
                    if (opt.name === packageName) {
                        wantedId = id;
                        break;
                    }
                }
                if (wantedId !== null) {
                    network.emit("click", { nodes: [wantedId] });
                }
            }
            utils.createItemsList(clone.getElementById("requireddep"), composition.required_thirdparty, graphDepListener, true);
            utils.createItemsList(clone.getElementById("usedby"), Object.keys(usedBy), graphDepListener, true);
            utils.createItemsList(clone.getElementById("internaldep"), composition.required_files, listener, true);
        }

        showInfoElem.appendChild(clone);

        // Request sizes on the bundlephobia API
        try {
            const {
                gzip, size, dependencySizes
            } = await utils.getJSON(`https://bundlephobia.com/api/size?package=${name}@${version}`);
            const fullSize = dependencySizes.reduce((prev, curr) => prev + curr.approximateSize, 0);

            document.querySelector(".size-gzip").textContent = prettyBytes(gzip);
            document.querySelector(".size-min").textContent = prettyBytes(size);
            document.querySelector(".size-full").textContent = prettyBytes(fullSize);
        }
        catch (err) {
            // ignore
        }
    }

    function neighbourHighlight(params) {
        network.stopSimulation();
        const allNodes = nodes.get({ returnType: "Object" });

        // if something is selected:
        if (params.nodes.length > 0) {
            highlightActive = true;
            const selectedNode = params.nodes[0];

            // mark all nodes as hard to read.
            for (const node of Object.values(allNodes)) {
                node.color = C_TRS;
            }

            // get the second degree nodes
            const connectedNodes = network.getConnectedNodes(selectedNode);
            const allConnectedNodes = [];
            for (let id = 0; id < connectedNodes.length; id++) {
                allConnectedNodes.push(...network.getConnectedNodes(connectedNodes[id]));
            }

            // all second degree nodes get a different color and their label back
            for (let id = 0; id < allConnectedNodes.length; id++) {
                allNodes[allConnectedNodes[id]].color = C_NORMAL;
            }

            // all first degree nodes get their own color and their label back
            for (let id = 0; id < connectedNodes.length; id++) {
                allNodes[connectedNodes[id]].color = C_SELECTED;
            }

            // the main node gets its own color and its label back.
            allNodes[selectedNode].color = C_MAIN;
            network.focus(selectedNode, { animation: true, scale: 0.35 });
        }
        else if (highlightActive) {
            highlightActive = false;
            for (const node of Object.values(allNodes)) {
                const { id, flags } = linker.get(Number(node.id));
                node.color = getColor(id, flags);
            }
        }

        // transform the object into an array
        nodes.update(Object.values(allNodes));
    }

    toggleModal = function toggleModal(templateName, customCallback = null) {
        const infoBox = document.querySelector(".modal-content > .infobox");
        if (typeof templateName === "string") {
            const templateElement = document.getElementById(templateName);
            const clone = templateElement.content.cloneNode(true);
            if (customCallback !== null) {
                customCallback(clone);
            }
            infoBox.appendChild(clone);
        }
        else {
            infoBox.innerHTML = "";
        }
        modal.classList.toggle("show");
    };
    window.toggleModal = toggleModal;

    function searchResultClick() {
        bar.resultRowClick(this.getAttribute("data-value"));
    }

    function handleAuthor(author) {
        const user = "name" in author ? author : { name: null };

        if (authorsList.has(user.name)) {
            authorsList.get(user.name).count++;
        }
        else if (user.name !== null) {
            authorsList.set(user.name, Object.assign({}, user, { count: 1 }));
        }
    }
});
