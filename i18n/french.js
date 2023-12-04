/* eslint-disable max-len */
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  startHttp: {
    invalidScannerVersion: tS`le fichier d'analyse correspond à la version '${0}' du scanner et ne satisfait pas la range '${1}' attendu par la CLI`,
    regenerate: "veuillez re-générer un nouveau fichier d'analyse JSON en utilisant votre CLI"
  }
};

export default { cli };
