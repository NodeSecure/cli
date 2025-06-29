// Import Third-party Dependencies
import type { Request, Response, NextFunction } from "express-serve-static-core";

// Import Internal Dependencies
import { context } from "../ALS.js";
import { ViewBuilder } from "../ViewBuilder.class.js";
import type { NestedStringRecord } from "../../index.js";

export interface AyncStoreContext {
  dataFilePath?: string;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
  viewBuilder: ViewBuilder;
}

export interface BuildContextMiddlewareOptions {
  autoReload?: boolean;
  storeProperties: Omit<AyncStoreContext, "viewBuilder">;
  projectRootDir: string;
  componentsDir: string;
}

export function buildContextMiddleware(options: BuildContextMiddlewareOptions) {
  const {
    autoReload = false,
    storeProperties,
    projectRootDir,
    componentsDir
  } = options;

  const viewBuilder = new ViewBuilder({
    autoReload,
    projectRootDir,
    componentsDir
  });

  return function addContext(_req: Request, _res: Response, next: NextFunction) {
    const store = { ...storeProperties, viewBuilder };
    context.run(store, next);
  };
}
