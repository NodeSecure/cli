// Import Node.js Dependencies
import { styleText } from "node:util";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import { select } from "@topcli/prompts";

export async function set() {
  const langs = await i18n.getLanguages();
  const selectedLang = await select(
    styleText(["green", "bold"], ` ${i18n.getTokenSync("cli.commands.lang.question_text")}`),
    {
      choices: langs
    }
  );

  await i18n.setLocalLang(selectedLang);
  await i18n.getLocalLang();

  console.log(
    styleText(
      ["white", "bold"], `\n ${i18n.getTokenSync("cli.commands.lang.new_selection", styleText(["yellow", "bold"], selectedLang))}`
    ));
  console.log();
}
