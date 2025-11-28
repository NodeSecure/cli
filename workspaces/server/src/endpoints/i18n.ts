// Import Third-party Dependencies
import send from "@polka/send-type";

// Import Internal Dependencies
import { context } from "../ALS.ts";

export async function get(_req, res) {
  const { i18n } = context.getStore()!;

  send(
    res,
    200,
    {
      english: i18n.english.ui,
      french: i18n.french.ui
    }
  );
}
