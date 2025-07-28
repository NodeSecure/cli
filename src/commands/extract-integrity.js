// Import Node.js Dependencies
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Import Third-party Dependencies
import * as npmRegistrySDK from "@nodesecure/npm-registry-sdk";
import { diff } from "json-diff-ts";
import { tarball } from "@nodesecure/scanner";
import {
  parseNpmSpec,
  packageJSONIntegrityHash
} from "@nodesecure/mama";

export async function main(
  npmPackageSpec
) {
  const parsedPackageSpec = parseNpmSpec(npmPackageSpec);
  if (!parsedPackageSpec) {
    throw new Error(`Invalid npm spec: ${npmPackageSpec}`);
  }

  const packumentVersion = await npmRegistrySDK.packumentVersion(
    parsedPackageSpec.name,
    parsedPackageSpec.semver,
    {
      token: process.env.NODE_SECURE_TOKEN
    }
  );
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
