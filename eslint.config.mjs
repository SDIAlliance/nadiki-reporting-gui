import { eslintrc } from "@eslint/eslintrc";
import nextPlugin from "eslint-config-next";

const { plugins, rules, settings, languageOptions } = nextPlugin;

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "out/**",
      "public/**"
    ],
    languageOptions: {
      ...languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins,
    rules: {
      ...rules,
      "@next/next/no-html-link-for-pages": "off",
    },
    settings,
  },
];