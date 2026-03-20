// Import Node.js Dependencies
import fsPromises from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve(import.meta.dirname, "./dataset-payload.json");

export async function getDataSetPayload() {
  const dataSetPayloadStr = await fsPromises.readFile(filePath);
  const dataSetPayload = JSON.parse(dataSetPayloadStr);

  return dataSetPayload;
}
