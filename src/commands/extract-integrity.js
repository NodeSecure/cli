// Import Node.js Dependencies
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

import {
  packageJSONIntegrityHash,
  parseNpmSpec
} from "@nodesecure/mama";
import * as npmRegistrySDK from "@nodesecure/npm-registry-sdk";
import { tarball } from "@nodesecure/scanner";
import { diff } from "json-diff-ts";

// Import Internal Dependencies
import kleur from "../utils/styleText.js";

const Ki18nCommandName = "cli.commands.extractIntegrity";

export async function main(
  npmPackageSpec
) {
  const parsedPackageSpec = parseNpmSpec(npmPackageSpec);
  if (!parsedPackageSpec) {
    console.log(kleur.red().bold(` [!] ${i18n.getTokenSync(`${Ki18nCommandName}.invalidSpec`, npmPackageSpec)}\n`));
    process.exit(1);
  }

  const { name, semver } = parsedPackageSpec;
  if (!semver) {
    console.log(kleur.red().bold(` [!] ${i18n.getTokenSync(`${Ki18nCommandName}.missingSpecVersion`, name)}\n`));
    process.exit(1);
  }

  let packumentVersion;
  try {
    packumentVersion = await npmRegistrySDK.packumentVersion(
      name,
      semver,
      {
        token: process.env.NODE_SECURE_TOKEN
      }
    );
  }
  catch (error) {
    if (error.statusCode === 404) {
      console.log(kleur.yellow().bold(` [!] ${i18n.getTokenSync(`${Ki18nCommandName}.specNotFound`, npmPackageSpec)}\n`));
      process.exit(1);
    }
  }

  const remote = packageJSONIntegrityHash(
    packumentVersion,
    { isFromRemoteRegistry: true }
  );

  const extractionDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "nodesecure-tarball-integrity-")
  );

  try {
    const mama = await tarball.extractAndResolve(extractionDirectory, {
      spec: npmPackageSpec
    });
    const local = packageJSONIntegrityHash(mama.document);

    if (local.integrity === remote.integrity) {
      console.log("no integrity diff found");

      return;
    }

    const diffs = diff(local.object, remote.object);
    console.log("integrity diff found:");
    console.log(JSON.stringify(diffs, null, 2));
  }
  finally {
    await fs.rm(extractionDirectory, { recursive: true, force: true });
  }
}
