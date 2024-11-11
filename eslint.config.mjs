import { ESLintConfig, globals } from "@openally/config.eslint";

export default [
  ...ESLintConfig,
  {
    rules: {
      "func-style": "off",
      "no-invalid-this": "off",
      "no-inner-declarations": "off",
      "no-case-declarations": "off",
      // TODO: enable this rule when migrating to @topcli/cmder
      "default-param-last": "off"
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    }
  },
  {
  ignores: ["**/node_modules/", "**/tmp/", "**/dist/", "**/coverage/", "**/fixtures/"]
  }
];
