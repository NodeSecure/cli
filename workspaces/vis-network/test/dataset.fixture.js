// Import Node.js Dependencies
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "./dataset-payload.json");

export async function getDataSetPayload() {
  const dataSetPayloadStr = await fsPromises.readFile(filePath);
  const dataSetPayload = JSON.parse(dataSetPayloadStr);

  return dataSetPayload;
}
