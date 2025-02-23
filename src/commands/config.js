// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

// Import Third-party Dependencies
import * as RC from "@nodesecure/rc";
import kleur from "kleur";

const K_HOME_PATH = path.join(os.homedir(), "nodesecure");

function spawnCodeAtNodeSecureRc(path, isCwd = false) {
  if (existsSync(path)) {
    spawn("code", [path]);

    return 0;
  }

  console.log(
    kleur
      .white()
      .bold(
        `\n ${kleur.yellow().bold(`There is no .nodesecurerc here: ${path}`)}`
      )
  );

  if (isCwd) {
    console.log(
      kleur
        .white()
        .bold(
          `\n ${kleur.yellow().bold("You must try to run nsecure config create")}`
        )
    );
  }

  return -1;
}

export function editConfigFile() {
  console.log("");

  console.log(
    kleur
      .white()
      .bold(
        `\n ${kleur.yellow().bold("Try to opened up your Nodesecure configuration in vscode")}`
      )
  );

  const isNodeSecureRcAtHomeDir = spawnCodeAtNodeSecureRc(path.join(K_HOME_PATH, RC.CONSTANTS.CONFIGURATION_NAME));

  if (isNodeSecureRcAtHomeDir === -1) {
    spawnCodeAtNodeSecureRc(path.join(process.cwd(), RC.CONSTANTS.CONFIGURATION_NAME), true);
  }
}

export async function createConfigFile(configuration = "minimal", opts) {
  const { cwd } = opts;

  const pathConfigFile = cwd ? process.cwd() : K_HOME_PATH;
  console.log("");
  console.log(
    kleur
      .white()
      .bold(
        `\n ${kleur.yellow().bold(`We are going to create the Nodesecure configuration file at: ${pathConfigFile}`)}`
      )
  );
  await fs.mkdir(pathConfigFile, { recursive: true });

  await RC.read(pathConfigFile, { createIfDoesNotExist: true, createMode: configuration });
}
