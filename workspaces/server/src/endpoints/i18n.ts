// Import Node.js Dependencies
import type {
  IncomingMessage,
  ServerResponse
} from "node:http";

// Import Internal Dependencies
import { context } from "../ALS.ts";
import { send } from "./util/send.ts";

export async function get(
  _req: IncomingMessage,
  res: ServerResponse
) {
  const { i18n } = context.getStore()!;

  send(
    res,
    {
      english: i18n.english.ui,
      french: i18n.french.ui
    }
  );
}
