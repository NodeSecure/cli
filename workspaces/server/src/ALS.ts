// Import Node.js Dependencies
import { AsyncLocalStorage } from "node:async_hooks";

// Import Third-party Dependencies
import type { PayloadCache } from "@nodesecure/cache";

// Import Internal Dependencies
import type { ViewBuilder } from "./ViewBuilder.class.ts";

export type NestedStringRecord = {
  [key: string]: string | NestedStringRecord;
};

export interface AsyncStoreContext {
  cache: PayloadCache;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
  viewBuilder: ViewBuilder;
}

export const context = new AsyncLocalStorage<AsyncStoreContext>();
