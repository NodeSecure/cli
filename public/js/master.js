"use strict";

// CONSTANTS (for nodes colors)
const C_MAIN = "#01579B";
const C_INDIRECT = "rgba(100, 200, 200, 0.30)";
const C_WARN = "rgba(210, 115, 115, 0.30)";
const C_NORMAL = "rgba(150, 200, 200, 0.15)";
const C_SELECTED = "rgba(170, 100, 200, 0.50)";
const C_TRS = "rgba(150, 150, 150, 0.02)";

const networkGraphOptions = {
    nodes: {
        mass: 6,
        shape: "box",
        size: 5,
        font: {
            face: "Roboto",
            vadjust: 1,
            size: 34,
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
            gravitationalConstant: -26,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18
        },
        maxVelocity: 150,
        solver: "forceAtlas2Based",
        timestep: 0.35,
        stabilization: { iterations: 150 }
    }
};

function getColor(id, flags) {
    if (id === 0) {
        return C_MAIN;
    }
    else if (flags.hasSuspectImport || flags.hasMinifiedCode) {
        return C_WARN;
    }
    else if (flags.hasIndirectDependencies) {
        return C_INDIRECT;
    }

    return C_NORMAL;
}

document.addEventListener("DOMContentLoaded", async() => {
    // Find elements and declare top vars
    const networkElement = document.getElementById("network-graph");
    let highlightActive = false;

    // Hydrate nodes & edges with the data
    const nodesDataArr = [];
    const edgesDataArr = [];
    const linker = new Map();

    const data = await request("/data");
    for (const [packageName, descriptor] of Object.entries(data)) {
        const { metadata, ...versions } = descriptor;

        for (const [currVersion, opt] of Object.entries(versions)) {
            const { id, usedBy, flags, size } = opt;
            opt.name = packageName;
            opt.version = currVersion;

            let flagStr = "";
            if (flags.hasIndirectDependencies) {
                flagStr += " 🌍";
            }
            if (flags.hasSuspectImport) {
                flagStr += " ⚠️";
            }
            if (flags.hasCustomResolver) {
                flagStr += " 🔆";
            }
            if (flags.hasLicense === false) {
                flagStr += " 📜";
            }
            if (flags.hasMinifiedCode) {
                flagStr += " 🔬";
            }
            if (flags.isDeprecated) {
                flagStr += " ⛔️";
            }

            const label = `${packageName}@${currVersion}${flagStr}\n<b>[${formatBytes(size)}]</b>`;
            const color = getColor(id, flags);

            linker.set(Number(id), opt);
            nodesDataArr.push({ id, label, color, font: { multi: "html" } });

            for (const [name, version] of Object.entries(usedBy)) {
                edgesDataArr.push({ from: id, to: data[name][version].id });
            }
        }
    }

    // Create required DataSet for the Network Graph
    const nodes = new vis.DataSet(nodesDataArr);
    const edges = new vis.DataSet(edgesDataArr);

    // Initialize vis Network
    const network = new vis.Network(networkElement, { nodes, edges }, networkGraphOptions);
    network.on("click", neighbourHighlight);
    network.on("click", updateMenu);

    function updateMenu(params) {
        const showInfoElem = document.getElementById("show-info");
        const packageInfoTemplate = document.getElementById("package-info");

        if (params.nodes.length > 0) {
            showInfoElem.innerHTML = "";

            const clone = document.importNode(packageInfoTemplate.content, true);
            const currentNode = params.nodes[0];
            const selectedNode = linker.get(Number(currentNode));

            clone.querySelector(".name").textContent = selectedNode.name;
            clone.querySelector(".version").textContent = selectedNode.version;
            clone.querySelector(".desc").textContent = selectedNode.description;

            const author = typeof selectedNode.author === "string" ? selectedNode.author : selectedNode.author.name;

            const fields = clone.querySelector(".fields");
            const fieldsFragment = document.createDocumentFragment();
            fieldsFragment.appendChild(
                createLiField("Author", author.length > 26 ? `${author.slice(0, 26)}...` : author));
            fieldsFragment.appendChild(createLiField("License", selectedNode.license));
            fieldsFragment.appendChild(createLiField("Size", formatBytes(selectedNode.size)));
            fields.appendChild(fieldsFragment);

            showInfoElem.appendChild(clone);
        }
        else {
            showInfoElem.innerHTML = "<div class=\"select-project\"><p>SELECT A PROJECT!</p></div>";
        }
    }

    function neighbourHighlight(params) {
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
});
