// Import Node.js Dependencies
import fs from "node:fs/promises";
import path from "node:path";

// Import Third-party Dependencies
import type { Payload } from "@nodesecure/scanner";

export async function getDataSetPayload(): Promise<Payload> {
  const dataSetPayloadStr = await fs.readFile(
    path.join(import.meta.dirname, "fixtures", "dataset-payload.json")
  );
  const dataSetPayload = JSON.parse(dataSetPayloadStr.toString());

  return dataSetPayload;
}
