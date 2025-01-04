// Import Node.js Dependencies
import { styleText } from "node:util";

// Import Third-party Dependencies
import * as i18n from "@nodesecure/i18n";

export function taggedI18nString(strings, ...keys) {
  return function cur(...i18nParameters) {
    const finalString = [strings[0]];

    keys.forEach((currentKey, index) => {
      const args = i18nParameters.shift() ?? [];

      finalString.push(
        i18n.getTokenSync(currentKey, ...args),
        strings[index + 1]
      );
    });

    return styleText(["white", "bold"], finalString.join(""));
  };
}
