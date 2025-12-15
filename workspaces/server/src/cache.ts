// Import Third-party Dependencies
import {
  AppCache
} from "@nodesecure/cache";

// Import Internal Dependencies
import { logger } from "./logger.ts";

export const cache = new AppCache(
  logger
);
