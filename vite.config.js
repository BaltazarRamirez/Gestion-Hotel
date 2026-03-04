import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Supabase importa "tslib"; hay que resolverlo explícitamente (está en dependencies).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tslibPath = path.resolve(__dirname, "node_modules/tslib");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      tslib: tslibPath,
    },
  },
  optimizeDeps: {
    include: ["tslib"],
  },
});
