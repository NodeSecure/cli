// Import Third-party Dependencies
import send from "@polka/send-type";

// Import Internal Dependencies
import english from "../../../i18n/english.js";
import french from "../../../i18n/french.js";

export async function get(_req, res) {
  send(
    res,
    200,
    {
      english: english.ui,
      french: french.ui
    }
  );
}
