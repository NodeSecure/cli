// Import Third-party Dependencies
import { downloads } from "@nodesecure/npm-registry-sdk";
import send from "@polka/send-type";

export async function get(req, res) {
  const { pkgName } = req.params;

  try {
    const data = await downloads(`${pkgName.replaceAll("%2F", "/")}`, "last-week");

    return send(res, 200, data);
  }
  catch (error) {
    return send(res, error.statusCode, { error: error.statusMessage });
  }
}
