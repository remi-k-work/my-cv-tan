import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
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
