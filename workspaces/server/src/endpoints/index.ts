// Import Third-party Dependencies
import router from "find-my-way";

// Import Internal Dependencies
import * as root from "./root.ts";
import * as data from "./data.ts";
import * as flags from "./flags.ts";
import * as config from "./config.ts";
import * as search from "./search.ts";
import * as bundle from "./bundle.ts";
import * as npmDownloads from "./npm-downloads.ts";
import * as scorecard from "./ossf-scorecard.ts";
import * as locali18n from "./i18n.ts";
import * as report from "./report.ts";

export function getApiRouter() {
  const apiRouter = router({
    ignoreTrailingSlash: true
  });

  apiRouter.get("/", root.get);
  apiRouter.get("/data", data.get);
  apiRouter.get("/config", config.get);
  apiRouter.put("/config", config.save);
  apiRouter.get("/i18n", locali18n.get);
  apiRouter.get("/search/:packageName", search.get);
  apiRouter.get("/search-versions/:packageName", search.versions);
  apiRouter.get("/flags", flags.getAll);
  apiRouter.get("/flags/description/:title", flags.get);
  apiRouter.get("/bundle/:packageName", bundle.get);
  apiRouter.get("/bundle/:packageName/:version", bundle.get);
  apiRouter.get("/downloads/:packageName", npmDownloads.get);
  apiRouter.get("/scorecard/:org/:packageName", scorecard.get);
  apiRouter.post("/report", report.post);

  return apiRouter;
}
