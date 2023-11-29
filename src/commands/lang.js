// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import { select } from "@topcli/prompts";
import kleur from "kleur";

export async function set() {
  const langs = await i18n.getLanguages();
  const selectedLang = await select(
    kleur.green().bold(` ${i18n.getTokenSync("cli.commands.lang.question_text")}`),
    {
      choices: langs
    }
  );

  await i18n.setLocalLang(selectedLang);
  await i18n.getLocalLang();

  console.log(
    kleur.white().bold(`\n ${i18n.getTokenSync("cli.commands.lang.new_selection", kleur.yellow().bold(selectedLang))}`)
  );
  console.log();
}
