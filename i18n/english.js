/* eslint-disable max-len */
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  startHttp: {
    invalidScannerVersion: tS`the payload has been scanned with version '${0}' and do not satisfies the required CLI range '${1}'`,
    regenerate: "please re-generate a new JSON payload using the CLI"
  }
};

const ui = {
  popup: {
    maintainer: {
      intree: "packages in the dependency tree"
    }
  },
  home: {
    overview: {
      title: "Overview"
    },
    watch: "Packages in the dependency tree requiring greater attention",
    criticalWarnings: "Critical Warnings",
    maintainers: "Maintainers"
  },
  settings: {
    general: {
      title: "General",
      save: "save",
      defaultPannel: "Default Package Menu",
      warnings: "SAST Warnings to ignore",
      flags: "Flags (emojis) to ignore"
    },
    shortcuts: {
      title: "Shortcuts",
      blockquote: "Click on hotkey to update",
      goto: "Goto",
      openCloseWiki: "Open/Close wiki",
      lock: "Lock/Unlock network"
    }
  }
};

export default { cli, ui };
