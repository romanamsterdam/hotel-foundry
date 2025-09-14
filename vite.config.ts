import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // TEMP: force a fresh dep pre-bundle to break the "Outdated Optimize Dep" loop
    force: true,
  },
  cacheDir: "node_modules/.vite"
});