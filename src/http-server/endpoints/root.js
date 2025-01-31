// Import Third-party Dependencies
import send from "@polka/send-type";

// Import Internal Dependencies
import { context } from "../context.js";

export async function get(_req, res) {
  try {
    res.writeHead(200, {
      "Content-Type": "text/html"
    });

    const { viewBuilder } = context.getStore();

    const templateStr = await viewBuilder.render();

    res.end(templateStr);
  }
  catch (err) {
    send(res, 500, { error: err.message });
  }
}
