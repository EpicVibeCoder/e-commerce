import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";
import { resolve } from "node:path";

export default defineConfig({
      test: {
            globals: true,
            environment: "node",
            root: ".",
      },
      plugins: [swc.vite({ module: { type: "es6" } })],
      resolve: {
            alias: { src: resolve(__dirname, "./src") },
      },
});
