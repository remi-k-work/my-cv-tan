import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { lazyPlugins } from "vite-plus";
import { recommended } from "@effect/tsgo/oxlint-presets";

export default defineConfig({
  lint: {
    extends: [recommended],
    plugins: ["eslint", "typescript", "react", "jsx-a11y", "import", "vitest", "unicorn", "oxc"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    ignorePatterns: [],
    rules: {
      "react/rules-of-hooks": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
      "effecttsgo/unstable-api-usage": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    endOfLine: "lf",
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    printWidth: 160,
    sortPackageJson: false,
    sortTailwindcss: { stylesheet: "src/assets/styles/globals.css", functions: ["cn", "cva"] },
    ignorePatterns: [".agents/**", ".vscode/**", "tsconfig.json", "wrangler.jsonc"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // The Effect runtime is shared by every route and only changes when dependencies do,
          // so it gets its own chunk: repeat visitors keep it in cache, and no chunk crosses
          // the size warning threshold
          groups: [{ name: "vendor-effect", test: /node_modules[\\/](effect|@effect|@lucas-barake)[\\/]/ }],
        },
      },
    },
  },
  plugins: lazyPlugins(() => [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({
      importProtection: {
        // Always error, even in dev
        behavior: "error",
      },
    }),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
    tailwindcss(),
  ]),
});
