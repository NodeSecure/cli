import { AsyncLocalStorage } from "node:async_hooks";

export const context = new AsyncLocalStorage();
