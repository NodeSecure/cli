// Import Node.js Dependencies
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

// Import Third-party Dependencies
import * as RC from "@nodesecure/rc";
import kleur from "kleur";
import { spawn } from "node:child_process";

const K_HOME_PATH = path.join(os.homedir(), "nodesecure");

async function spawnCodeAtNodeSecureRc(path, isCwd = false) {
  try {
    await fs.access(path);
    spawn("code", [path]);

    return 0;
  }
  catch (_e) {
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
}

export async function editConfigFile() {
  console.log("");

  console.log(
    kleur
      .white()
      .bold(
        `\n ${kleur.yellow().bold("Try to opened up your Nodesecure configuration in vscode")}`
      )
  );

  const isNodeSecureRcAtHomeDir = await spawnCodeAtNodeSecureRc(path.join(K_HOME_PATH, RC.CONSTANTS.CONFIGURATION_NAME));

  if (isNodeSecureRcAtHomeDir === -1) {
    spawnCodeAtNodeSecureRc(path.join(process.cwd(), RC.CONSTANTS.CONFIGURATION_NAME), true);
  }
}

export async function createConfigFile(opts) {
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
  try {
    await fs.access(pathConfigFile);
  }
  catch (_e) {
    await fs.mkdir(pathConfigFile);
  }
  finally {
    await RC.read(pathConfigFile, { createIfDoesNotExist: true, createMode: "complete" });
  }
}
