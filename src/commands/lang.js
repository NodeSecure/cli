// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import qoa from "qoa";
import kleur from "kleur";

export async function set() {
  console.log("");
  const { selectedLang } = await qoa.interactive({
    query: kleur.green().bold(` ${i18n.getToken("cli.commands.lang.question_text")}`),
    handle: "selectedLang",
    menu: i18n.getLanguages()
  });

  await i18n.setLocalLang(selectedLang);
  console.log(
    kleur.white().bold(`\n ${i18n.getToken("cli.commands.lang.new_selection", kleur.yellow().bold(selectedLang))}`)
  );
  console.log("");
}
