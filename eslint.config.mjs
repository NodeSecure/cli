import { ESLintConfig, globals } from "@openally/config.eslint";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  ...ESLintConfig,
  {
    rules: {
      "no-invalid-this": "off"
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    }
  },
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
  }
];
