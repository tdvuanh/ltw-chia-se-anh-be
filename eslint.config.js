import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "prettier/prettier": "error",
    },
  },
];
