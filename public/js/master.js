"use strict";

// CONSTANTS (for nodes colors)
const C_INT = "#FFCA28";
const C_OFF = "#607D8B";
const C_TRS = "rgba(200, 200, 200, 0.05)";

const networkGraphOptions = {
    nodes: {
        mass: 3,
        shape: "text",
        size: 24,
        font: {
            face: "Roboto",
            vadjust: 1,
            size: 34,
            color: "#ECEFF1",
            bold: "24px"
        },
        margin: 10,
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

    // Hydrate nodes & edges with the data
    const nodesDataArr = [];
    const edgesDataArr = [];
    const data = await request("/data");
    for (const [packageName, descriptor] of Object.entries(data)) {
        const { metadata, ...versions } = descriptor;

        for (const [currVersion, opt] of Object.entries(versions)) {
            const { id, usedBy } = opt;
            const label = `${packageName}@${currVersion}`;

            nodesDataArr.push({ id, label, color: C_INT });

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
