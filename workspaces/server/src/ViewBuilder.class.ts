// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import zup from "zup";
import * as i18n from "@nodesecure/i18n";
import chokidar from "chokidar";
import { globStream } from "glob";

// Import Internal Dependencies
import { logger } from "./logger.js";

export interface ViewBuilderOptions {
  autoReload?: boolean;
  projectRootDir: string;
  componentsDir: string;
}

export class ViewBuilder {
  #cached: string | null = null;
  projectRootDir: string;
  componentsDir: string;

  constructor(options: ViewBuilderOptions) {
    const {
      autoReload = false,
      projectRootDir,
      componentsDir
    } = options;

    this.projectRootDir = projectRootDir;
    this.componentsDir = componentsDir;

    if (autoReload) {
      this.#enableWatcher();
    }
  }

  async #enableWatcher() {
    logger.info("[ViewBuilder] autoReload is enabled");

    const watcher = chokidar.watch(this.componentsDir, {
      persistent: false,
      awaitWriteFinish: true,
      ignored: (path, stats) => (stats?.isFile() ?? false) && !path.endsWith(".html")
    });
    watcher.on("change", (filePath) => this.#freeCache(filePath));
  }

  async #freeCache(
    filePath: string
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
      path.join(this.projectRootDir, "views", "index.html"),
      "utf-8"
    );

    const componentsPromises: Promise<string>[] = [];
    for await (
      const htmlComponentPath of globStream("**/*.html", { cwd: this.componentsDir })
    ) {
      componentsPromises.push(
        fs.readFile(
          path.join(this.componentsDir, htmlComponentPath),
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

  async render(): Promise<string> {
    const i18nLangName = await i18n.getLocalLang();

    const HTMLStr = await this.#build();
    const templateStr = zup(HTMLStr)({
      lang: i18n.getTokenSync("lang"),
      i18nLangName,
      token: (tokenName: string) => i18n.getTokenSync(`ui.${tokenName}`)
    });

    return templateStr;
  }
}
