// Import Node.js Dependencies
import fs from "node:fs";
import { pipeline } from "node:stream";

// Import Internal Dependencies
import { context } from "../context.js";

export async function get(req, res) {
  const { dataFilePath } = context.getStore();

  res.writeHead(200, { "Content-Type": "application/json" });

  pipeline(fs.createReadStream(dataFilePath), res, (err) => {
    if (err) {
      console.error(err);
    }
  });
}
