// Import Node.js Dependencies
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import Third-party Dependencies
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [{
  ignores: ["**/node_modules/", "**/tmp/", "**/dist/", "**/coverage/", "**/fixtures/"]
}, ...compat.extends("@nodesecure/eslint-config"), {
  languageOptions: {
    ecmaVersion: 2015,
    sourceType: "module",

    parserOptions: {
      requireConfigFile: false
    }
  },

  rules: {
    "func-style": "off",
    "no-invalid-this": "off",
    "no-inner-declarations": "off",
    "no-case-declarations": "off"
  }
}];
