// Import Third-party Dependencies
import kleur from "kleur";
import { diffChars } from "diff";
import { packumentVersion } from "@nodesecure/npm-registry-sdk";
import { tarball } from "@nodesecure/scanner";

export async function main(spec, options) {
  const [pkgName, pkgVersion] = spec.split("@");
  const { dist: { tarball: location, shasum: manifestIntegrity } } = await packumentVersion(pkgName, pkgVersion, {
    token: options.token
  });
  const manifestManager = await tarball.extractAndResolve(location, {
    spec
  });
  const tarballIntegrity = manifestManager.integrity;
  if (manifestIntegrity === tarballIntegrity) {
    console.log(`integrity: ${manifestIntegrity}`);

    return;
  }

  console.log(`manifest integrity: ${manifestIntegrity}`);
  console.log(`tarball integrity: ${tarballIntegrity}`);
  process.stdout.write("integrity diff: ");
  for (const { added, removed, value } of diffChars(manifestIntegrity, tarballIntegrity)) {
    if (added) {
      process.stdout.write(kleur.green().bold(`+${value}`));
    }
    else if (removed) {
      process.stdout.write(kleur.red().bold(`-${value}`));
    }
    else {
      process.stdout.write(value);
    }
  }
  console.log("\n");
}
