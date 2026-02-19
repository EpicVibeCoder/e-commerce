import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

export const config = defineConfig([
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: { turbo: turboPlugin },
    rules: { "turbo/no-undeclared-env-vars": "warn" },
  },
  { ignores: ["dist/**"] },
]);