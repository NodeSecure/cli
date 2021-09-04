// Import Node.js Dependencies
import fs from "fs/promises";
import path from "path";
import events from "events";

// Import Third-party Dependencies
import kleur from "kleur";
import filenamify from "filenamify";
import * as i18n from "@nodesecure/i18n";
import * as scanner from "@nodesecure/scanner";

// Import Internal Dependencies
import * as http from "./http.js";

export async function auto(packageName, opts) {
  const keep = Boolean(opts.keep);
  delete opts.keep;
  delete opts.k;

  const payloadFile = await (typeof packageName === "string" ? from(packageName, opts) : cwd(opts));
  try {
    if (payloadFile !== null) {
      await http.start();
      await events.once(process, "SIGINT");
    }
  }
  finally {
    if (!keep && payloadFile !== null) {
      try {
        await fs.unlink(payloadFile);
      }
      catch (error) {
        if (error.code !== "ENOENT") {
          // eslint-disable-next-line no-unsafe-finally
          throw error;
        }
      }
    }
  }
}

export async function cwd(opts) {
  const { depth: maxDepth = 4, output, nolock, full, vulnerabilityStrategy } = opts;

  const payload = await scanner.cwd(void 0,
    { verbose: true, maxDepth, usePackageLock: !nolock, fullLockMode: full, vulnerabilityStrategy }
  );

  return await logAndWrite(payload, output);
}

export async function from(packageName, opts) {
  const { depth: maxDepth = 4, output } = opts;

  const payload = await scanner.from(packageName, { verbose: true, maxDepth });

  return await logAndWrite(payload, output);
}

async function logAndWrite(payload, output = "nsecure-result") {
  if (payload === null) {
    console.log(i18n.getToken("cli.no_dep_to_proceed"));

    return null;
  }

  const ret = JSON.stringify(payload, null, 2);

  const fileName = path.extname(output) === ".json" ? filenamify(output) : `${filenamify(output)}.json`;
  const filePath = path.join(process.cwd(), fileName);
  await fs.writeFile(filePath, ret);

  console.log(kleur.white().bold(i18n.getToken("cli.successfully_written_json", kleur.green().bold(filePath))));
  console.log("");

  return filePath;
}
