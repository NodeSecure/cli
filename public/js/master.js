"use strict";

// CONSTANTS (for nodes colors)
const C_EXT = "#673AB7";
const C_INT = "#E65100";
const C_OFF = "#607D8B";
const C_TRS = "rgba(200, 200, 200, 0.05)";

const networkGraphOptions = {
    nodes: {
        mass: 1.5,
        shape: "box",
        size: 24,
        font: {
            face: "Roboto",
            vadjust: 0.5,
            size: 22,
            color: "#ECEFF1",
            bold: "22px"
        },
        margin: 7.5,
        shadow: {
            enabled: true,
            color: "rgba(20, 20, 20, 0.2)"
        }
    },
    edges: {
        arrows: "from",
        hoverWidth: 2,
        selectionWidth: 2,
        width: 1.2
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
    let id = 0;

    // Hydrate nodes & edges with the data
    const nodesDataArr = [];
    const edgesDataArr = [];
    const data = await request("/data");
    for (const [label, desc] of Object.entries(data)) {
        nodesDataArr.push({ id: id++, label, color: C_INT });
    }

    // Create required DataSet for the Network Graph
    const nodes = new vis.DataSet(nodesDataArr);
    const edges = new vis.DataSet(edgesDataArr);

    // Initialize vis Network
    const network = new vis.Network(networkElement, { nodes, edges }, networkGraphOptions);
    network.on("click", neighbourHighlight);

    // Create custom methods for interaction
    function neighbourHighlight(params) {
        const allNodes = nodesDataset.get({ returnType: "Object" });
        console.log(allNodes);
    }
});
