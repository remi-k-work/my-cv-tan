import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      // Compat shim: @lucas-barake/effect-form* betas import the v4-beta-only
      // "effect/unstable/reactivity/*" paths, removed in Effect v4 final.
      // Re-point them at the stable "effect/reactivity/*" modules.
      // TODO: drop when the form packages release a v4-final build.
      { find: /^effect\/unstable\/reactivity\/(.*)$/, replacement: "effect/reactivity/$1" },
    ],
  },
  plugins: [
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
  ],
});
