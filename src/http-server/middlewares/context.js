// Import Internal Dependencies
import { context } from "../../ALS.js";
import { ViewBuilder } from "../ViewBuilder.class.js";

export function buildContextMiddleware(
  autoReload = false,
  storeProperties = {}
) {
  const viewBuilder = new ViewBuilder({
    autoReload
  });

  return function addContext(_req, _res, next) {
    const store = { ...storeProperties, viewBuilder };
    context.run(store, next);
  };
}
