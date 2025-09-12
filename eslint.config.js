// ESLint flat config for ESLint v9+
// Minimal configuration to enable linting .mjs files in this repo
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files-new

export default [
  // Project files config
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    // No rules enabled by default to avoid introducing new CI failures.
    // Add rules here as the project evolves.
  },
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "dist/**",
      ".git/**",
    ],
  },
];
