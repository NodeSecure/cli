// Import Third-party Dependencies
import { ESLintConfig, typescriptConfig, globals } from "@openally/config.eslint";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  ...ESLintConfig,
  {
    files: ["public/**/*.js"],
    plugins: {
      jsdoc
    },
    rules: {
      "jsdoc/no-undefined-types": ["warn", {
        disableReporting: true,
        markVariablesAsUsed: true
      }]
    }
  },
  {
    ignores: [
      "**/node_modules/",
      "**/tmp/",
      "**/dist/",
      "**/coverage/",
      "**/fixtures/"
    ]
  },
  ...typescriptConfig({
    rules: {
      "no-invalid-this": "off"
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    }
  })
];
