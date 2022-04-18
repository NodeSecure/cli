// Import Third-party Dependencies
import * as RC from "@nodesecure/rc";
import qoa from "qoa";
import kleur from "kleur";

export const KCommand = {
  init: ["init", "i"],
  modify: ["modify", "m"],
  delete: ["delete", "d"]
};

async function modify() {
  console.log("");
  const { selectedLang } = await qoa.interactive({
    // TODO: Must be replace by nodesecure/i18n
    query: kleur.green().bold("Try to read config file"),
    handle: "selectedLang",
    menu: i18n.getLanguages()
  });

  await i18n.setLocalLang(selectedLang);
  console.log(
    kleur.white().bold(`\n ${i18n.getToken("cli.commands.lang.new_selection", kleur.yellow().bold(selectedLang))}`)
  );
  console.log("");
}

async function create() {
  console.log("");
  const { selectedLang } = await qoa.interactive({
    // TODO: Must be replace by nodesecure/i18n
    query: kleur.green().bold("Init config file"),
    handle: "selectedLang",
    menu: i18n.getLanguages()
  });

  await i18n.setLocalLang(selectedLang);
  console.log(
    kleur.white().bold(`\n ${i18n.getToken("cli.commands.lang.new_selection", kleur.yellow().bold(selectedLang))}`)
  );
  console.log("");
}

async function remove() {
  console.log("");
  const { selectedLang } = await qoa.interactive({
    // TODO: Must be replace by nodesecure/i18n
    query: kleur.green().bold("remove config file"),
    handle: "selectedLang",
    menu: i18n.getLanguages()
  });

  await i18n.setLocalLang(selectedLang);
  console.log(
    kleur.white().bold(`\n ${i18n.getToken("cli.commands.lang.new_selection", kleur.yellow().bold(selectedLang))}`)
  );
  console.log("");
}

export async function main(opts = {}) {
  //  
  return opts;
}
