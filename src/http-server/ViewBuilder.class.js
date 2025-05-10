// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import zup from "zup";
import * as i18n from "@nodesecure/i18n";
import chokidar from "chokidar";
import { globStream } from "glob";

// Import Internal Dependencies
import { logger } from "../logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kProjectRootDir = path.join(__dirname, "..", "..");
const kComponentsDir = path.join(kProjectRootDir, "public", "components");

export class ViewBuilder {
  #cached = null;

  constructor(options = {}) {
    const { autoReload = false } = options;

    if (autoReload) {
      this.#enableWatcher();
    }
  }

  async #enableWatcher() {
    logger.info("[ViewBuilder] autoReload is enabled");

    const watcher = chokidar.watch(kComponentsDir, {
      persistent: false,
      awaitWriteFinish: true,
      ignored: (path, stats) => stats?.isFile() && !path.endsWith(".html")
    });
    watcher.on("change", (filePath) => this.#freeCache(filePath));
  }

  async #freeCache(
    filePath
  ) {
    logger.info("[ViewBuilder] the cache has been released");
    logger.info(`[ViewBuilder](filePath: ${filePath})`);

    this.#cached = null;
  }

  async #build() {
    if (this.#cached) {
      return this.#cached;
    }

    let HTMLStr = await fs.readFile(
      path.join(kProjectRootDir, "views", "index.html"),
      "utf-8"
    );

    const componentsPromises = [];
    for await (
      const htmlComponentPath of globStream("**/*.html", { cwd: kComponentsDir })
    ) {
      componentsPromises.push(
        fs.readFile(
          path.join(kComponentsDir, htmlComponentPath),
          "utf-8"
        )
      );
    }
    const components = await Promise.all(
      componentsPromises
    );
    HTMLStr += components.reduce((prev, curr) => prev + curr, "");

    this.#cached = HTMLStr;
    logger.info("[ViewBuilder] the cache has been hydrated");

    return HTMLStr;
  }

  /**
   * @returns {Promise<string>}
   */
  async render() {
    const i18nLangName = await i18n.getLocalLang();

    const HTMLStr = await this.#build();
    const templateStr = zup(HTMLStr)({
      lang: i18n.getTokenSync("lang"),
      i18nLangName,
      token: (tokenName) => i18n.getTokenSync(`ui.${tokenName}`)
    });

    return templateStr;
  }
}
