// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import { CACHE_PATH } from "../src/cache.js";

await cacache.rm.all(CACHE_PATH);

console.log("Cache cleared successfully!");
