// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";
import kleur from "kleur";

export function taggedI18nString(strings, ...keys) {
  return function cur(...i18nParameters) {
    const finalString = [strings[0]];

    keys.forEach((currentKey, index) => {
      const args = i18nParameters.shift() ?? [];

      finalString.push(
        i18n.getToken(currentKey, ...args),
        strings[index + 1]
      );
    });

    return kleur.white().bold(finalString.join(""));
  };
}
