import { defineConfig } from "eslint/config";
import nestPlugin from "eslint-plugin-nestjs";
import { config as baseConfig } from "./base.js";

export const nestConfig = defineConfig([
      ...baseConfig,
      {
            plugins: { nestjs: nestPlugin },
            rules: {
                  ...nestPlugin.configs.recommended.rules,
            },
      },
]);
