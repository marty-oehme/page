import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import tailwind from "@astrojs/tailwind";

const { SITE } = loadEnv(import.meta.env.MODE, process.cwd(), "");
let site = SITE ?? "https://martyoeh.me";

// https://astro.build/config
export default defineConfig({
  site: site,
  integrations: [tailwind()],
});
