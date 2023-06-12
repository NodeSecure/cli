// Import Node.js Dependencies
import path from "node:path";
import os from "node:os";

// Import Third-party Depedencies
import cacache from "cacache";

// CONSTANTS
const kCachePath = path.join(os.tmpdir(), "nsecure-cli");
const kConfigKey = "cli-config";

export async function get() {
  try {
    const { data } = await cacache.get(kCachePath, kConfigKey);

    return JSON.parse(data.toString());
  }
  catch {
    const defaultValue = {
      defaultPackageMenu: "info",
      ignore: { flags: [], warnings: [] }
    };

    await cacache.put(kCachePath, kConfigKey, JSON.stringify(defaultValue));

    return defaultValue;
  }
}

export async function set(newValue) {
  await cacache.put(kCachePath, kConfigKey, JSON.stringify(newValue));
}
