/**
 * SELECTED -> The color when a Node is selected.
 * CONNECTED_IN -> The color for first-degree nodes connected in the selected one.
 * CONNECTED_OUT -> The color for first-degree nodes connected out the selected one.
 * DEFAULT -> Default color for all nodes.
 * WARN -> Color for nodes with vulnerabilities or SAST warnings.
 * HARDTOREAD -> A color to make a node hard to read (useful in selection mode).
 */

export const COLORS = Object.freeze({
  LIGHT: {
    SELECTED: {
      color: "#4527A0",
      font: {
        color: "#FFF"
      }
    },
    DEFAULT: {
      color: "#E3F2FD",
      font: {
        color: "#121533"
      }
    },
    WARN: {
      color: "#EF5350",
      font: {
        color: "#FFF"
      }
    },
    CONNECTED_IN: {
      color: "#C8E6C9",
      font: {
        color: "#1B5E20"
      }
    },
    CONNECTED_OUT: {
      color: "#F0F4C3",
      font: {
        color: "#827717"
      }
    },
    HARDTOREAD: {
      color: "rgba(20, 20, 20, 0.1)",
      font: {
        color: "#757575"
      }
    }
  },
  DARK: {
    SELECTED: {
      color: "#01579B",
      font: {
        color: "#FFF"
      }
    },
    DEFAULT: {
      color: "rgba(150, 200, 200, 0.15)",
      font: {
        color: "#FFF"
      }
    },
    WARN: {
      color: "rgba(210, 115, 115, 0.30)",
      font: {
        color: "#FFF"
      }
    },
    CONNECTED_IN: {
      color: "rgba(170, 100, 200, 0.50)",
      font: {
        color: "#FFF"
      }
    },
    CONNECTED_OUT: {
      color: "rgba(140, 100, 200, 0.50)",
      font: {
        color: "#FFF"
      }
    },
    HARDTOREAD: {
      color: "rgba(150, 150, 150, 0.02)",
      font: {
        color: "#FFF"
      }
    }
  }
});
