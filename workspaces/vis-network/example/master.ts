// Import Third-party Dependencies
import type { Payload } from "@nodesecure/scanner";

// Import Internal Dependencies
import {
  NodeSecureDataSet,
  NodeSecureNetwork
} from "../src/index.ts";
import payload from "./payload.json" with { type: "json" };

declare global {
  interface Window {
    FLAGS: unknown;
  }
}

document.addEventListener("DOMContentLoaded", async() => {
  const secureDataSet = new NodeSecureDataSet();
  await secureDataSet.init(
    payload as unknown as Payload,
    window.FLAGS
  );

  new NodeSecureNetwork(secureDataSet, {
    theme: "LIGHT"
  });
});
