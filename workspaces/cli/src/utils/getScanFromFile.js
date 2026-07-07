// Import Node.js Dependencies
import { readFile } from "node:fs/promises";
import path from "node:path";

// Import Third-party Dependencies
import filenamify from "filenamify";

export async function getScanFromFile(output = "nsecure-result") {
  const fileName = path.extname(output) === ".json" ?
    filenamify(output) :
    `${filenamify(output)}.json`;

  const filePath = path.join(process.cwd(), fileName);

  return JSON.parse(await readFile(filePath, "utf8"));
}
