import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/elastic_integrations_site/" : "/",
  plugins: [react()],
  build: { outDir: "dist-pages", emptyOutDir: true },
});
