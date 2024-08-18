// Import Third-party Dependencikes
import * as scorecard from "@nodesecure/ossf-scorecard-sdk";
import send from "@polka/send-type";

export async function get(req, res) {
  const { org, pkgName } = req.params;
  const { platform = "github.com" } = req.query;

  try {
    const data = await scorecard.result(`${org}/${pkgName}`, {
      resolveOnVersionControl: Boolean(process.env.GITHUB_TOKEN),
      resolveOnNpmRegistry: false,
      platform
    });

    console.log('Scorecard result successfully retrieved:', data);

    return send(res, 200, {
      data
    });
  }
  catch (error) {
    console.error('Error fetching scorecard result:', error);
    return send(
      res,
      error.statusCode ?? 404,
      { error: error.statusMessage ?? "Not Found" }
    );
  }
}
