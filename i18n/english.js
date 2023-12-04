/* eslint-disable max-len */
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  startHttp: {
    invalidScannerVersion: tS`the payload has been scanned with version '${0}' and do not satisfies the required CLI range '${1}'`,
    regenerate: "please re-generate a new JSON payload using the CLI"
  }
};

export default { cli };
