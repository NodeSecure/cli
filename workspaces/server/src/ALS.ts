// Import Node.js Dependencies
import { AsyncLocalStorage } from "node:async_hooks";

// Import Internal Dependencies
import type { ViewBuilder } from "./ViewBuilder.class.ts";

export type NestedStringRecord = {
  [key: string]: string | NestedStringRecord;
};

export interface AsyncStoreContext {
  dataFilePath?: string;
  i18n: {
    english: NestedStringRecord;
    french: NestedStringRecord;
  };
  viewBuilder: ViewBuilder;
}

export const context = new AsyncLocalStorage<AsyncStoreContext>();
