// Import Node.js Dependencies
import { AsyncLocalStorage } from "node:async_hooks";

// Import Internal Dependencies
import type { AyncStoreContext } from "./middlewares/context.ts";

export const context = new AsyncLocalStorage<AyncStoreContext>();
