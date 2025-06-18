// Import Internal Dependencies
import { context } from "../ALS.js";
import { ViewBuilder } from "../ViewBuilder.class.js";

export function buildContextMiddleware(options) {
  const {
    autoReload = false,
    storeProperties = {},
    projectRootDir,
    componentsDir
  } = options;

  const viewBuilder = new ViewBuilder({
    autoReload,
    projectRootDir,
    componentsDir
  });

  return function addContext(_req, _res, next) {
    const store = { ...storeProperties, viewBuilder };
    context.run(store, next);
  };
}
