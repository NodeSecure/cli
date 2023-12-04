/* eslint-disable max-len */
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  startHttp: {
    invalidScannerVersion: tS`le fichier d'analyse correspond à la version '${0}' du scanner et ne satisfait pas la range '${1}' attendu par la CLI`,
    regenerate: "veuillez re-générer un nouveau fichier d'analyse JSON en utilisant votre CLI"
  }
};

const ui = {
  popup: {
    maintainer: {
      intree: "packages dans l'abre de dépendances"
    }
  },
  home: {
    overview: {
      title: "Vue d'ensemble"
    },
    watch: "Packages dans l'arbre de dépendance nécessitant une plus grande attention",
    criticalWarnings: "Avertissements critiques",
    maintainers: "Mainteneurs"
  },
  settings: {
    general: {
      title: "Général",
      save: "sauvegarder",
      defaultPannel: "Panneau par défaut",
      warnings: "Avertissements à ignorer",
      flags: "Drapeau (emojis) à ignorer"
    },
    shortcuts: {
      title: "Raccourcis",
      blockquote: "Cliquer sur le raccourci clavier pour mettre à jour",
      goto: "Ouvrir",
      openCloseWiki: "Ouverture/Fermeture du wiki"
    }
  }
};

export default { cli, ui };
