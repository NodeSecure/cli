"use strict";

// CONSTANTS (for nodes colors)
const C_MAIN = "#01579B";
const C_INDIRECT = "rgba(100, 200, 200, 0.30)";
const C_WARN = "rgba(210, 115, 115, 0.30)";
const C_TRS = "rgba(150, 200, 200, 0.10)";

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
            bold: "32px"
        },
        margin: 12,
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

document.addEventListener("DOMContentLoaded", async() => {
    // Find elements and declare top vars
    const networkElement = document.getElementById("network-graph");

    // Hydrate nodes & edges with the data
    const nodesDataArr = [];
    const edgesDataArr = [];
    const data = await request("/data");
    for (const [packageName, descriptor] of Object.entries(data)) {
        const { metadata, ...versions } = descriptor;

        for (const [currVersion, opt] of Object.entries(versions)) {
            const { id, usedBy, flags } = opt;
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

            const label = `${packageName}@${currVersion}${flagStr}`;
            let color;
            if (id === 0) {
                color = C_MAIN;
            }
            else if (flags.hasSuspectImport || flags.hasMinifiedCode) {
                color = C_WARN;
            }
            else if (flags.hasIndirectDependencies) {
                color = C_INDIRECT;
            }
            else {
                color = C_TRS;
            }

            nodesDataArr.push({ id, label, color });

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

    // Create custom methods for interaction
    function neighbourHighlight(params) {
        const allNodes = nodes.get({ returnType: "Object" });
        console.log(allNodes);
    }
});
