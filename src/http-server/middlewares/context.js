// Import Internal Dependencies
import { context } from "../../ALS.js";
import { ViewBuilder } from "../ViewBuilder.class.js";

export function buildContextMiddleware(
  dataFilePath,
  autoReload = false
) {
  const viewBuilder = new ViewBuilder({
    autoReload
  });

  return function addContext(_req, _res, next) {
    const store = { dataFilePath, viewBuilder };
    context.run(store, next);
  };
}
