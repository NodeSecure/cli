// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import { appCache } from "@nodesecure/cache";
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

  try {
    const config = await appCache.getConfig();

    if (config) {
      await appCache.updateConfig({
        ...config,
        lang: selectedLang
      });
    }
  }
  catch {
    // Config does not exist, do nothing
  }

  console.log(
    kleur.white().bold(`\n ${i18n.getTokenSync("cli.commands.lang.new_selection", kleur.yellow().bold(selectedLang))}`)
  );
  console.log();
}
