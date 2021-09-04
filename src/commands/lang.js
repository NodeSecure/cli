// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import qoa from "qoa";
import kleur from "kleur";

const { white, green, yellow } = kleur;

export async function set() {
  const currentLang = i18n.getLocalLang();
  const langs = ["french", "english"];

  langs.splice(langs.indexOf(currentLang), 1);
  langs.unshift(currentLang);

  console.log("");
  const { selectedLang } = await qoa.interactive({
    query: green().bold(` ${i18n.getToken("cli.commands.lang.question_text")}`),
    handle: "selectedLang",
    menu: langs
  });

  await i18n.setLocalLang(selectedLang);
  console.log(white().bold(`\n ${i18n.getToken("cli.commands.lang.new_selection", yellow().bold(selectedLang))}`));
}
