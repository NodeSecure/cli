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
      color: "#BFC5E0",
      font: {
        color: "#443730"
      }
    },
    SELECTED_GROUP: {
      color: "#0D47A1",
      font: {
        color: "#FFF"
      }
    },
    SELECTED_LOCK: {
      color: "#1A237E",
      font: {
        color: "#FFF"
      }
    },
    DEFAULT: {
      color: "#BEE7E8",
      font: {
        color: "#121533"
      }
    },
    WARN: {
      color: "#FFBFA0",
      font: {
        color: "#6B2737"
      }
    },
    FRIENDLY: {
      color: "#EDEEC0",
      font: {
        color: "#0e4522"
      }
    },
    HIGHLIGHTED: {
      color: "#EA9010"
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
    SELECTED_GROUP: {
      color: "#1A237E",
      font: {
        color: "#FFF"
      }
    },
    SELECTED_LOCK: {
      color: "#0D47A1",
      font: {
        color: "#FFF"
      }
    },
    DEFAULT: {
      color: "rgb(94, 112, 146)",
      font: {
        color: "#FFF"
      }
    },
    WARN: {
      color: "rgb(177, 78, 78)",
      font: {
        color: "#FFF"
      }
    },
    FRIENDLY: {
      color: "rgb(57, 122, 57)",
      font: {
        color: "#FFF"
      }
    },
    HIGHLIGHTED: {
      color: "#dec42c"
    },
    CONNECTED_IN: {
      color: "rgb(89, 44, 109)",
      font: {
        color: "#FFF"
      }
    },
    CONNECTED_OUT: {
      color: "rgb(111, 75, 165)",
      font: {
        color: "#FFF"
      }
    },
    HARDTOREAD: {
      color: "rgba(117, 117, 117, 0)",
      font: {
        color: "#FFF"
      }
    }
  }
});

export const LABELS = Object.freeze({
  INCOMING: (i18n) => {
    return {
      label: i18n.network.childOf,
      font: {
        background: "#EEE"
      }
    };
  },
  OUTGOING: (i18n) => {
    return {
      label: i18n.network.parentOf,
      font: {
        background: "#EEE"
      }
    };
  },
  NONE: {
    // A space is used to simulate resetting the edge laebl
    label: " ",
    font: {
      background: "Transparent"
    }
  }
});
