// Import Node.js Dependencies
import { join, dirname } from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";

// Import Third-party Dependencies
import zup from "zup";
import send from "@polka/send-type";
import * as i18n from "@nodesecure/i18n";

const __dirname = dirname(fileURLToPath(import.meta.url));
const kProjectRootDir = join(__dirname, "..", "..", "..");

export async function buildHtml() {
  const HTMLStr = await readFile(join(kProjectRootDir, "views", "index.html"), "utf-8");
  const templateStr = zup(HTMLStr)({
    lang: i18n.getToken("lang"),
    token: (tokenName) => i18n.getToken(`ui.${tokenName}`)
  });

  return templateStr;
}

export async function get(req, res) {
  try {
    res.writeHead(200, {
      "Content-Type": "text/html"
    });

    const templateStr = await buildHtml();

    res.end(templateStr);
  }
  catch (err) {
    send(res, 500, { error: err.message });
  }
}
