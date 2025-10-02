import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwind from "@astrojs/tailwind";
import remarkToc from "remark-toc";
import { remarkReadingTime } from "./src/plugins/remark/reading-time.mjs";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import { transformerNotationDiff } from "@shikijs/transformers";

const { SITE } = loadEnv(import.meta.env.MODE, process.cwd(), "");
let site = SITE ?? "https://martyoeh.me";

// https://astro.build/config
export default defineConfig({
  site: site,
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    icon(),
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      transformers: [transformerNotationDiff()],
    },
    remarkPlugins: [
      remarkReadingTime,
      [
        remarkToc,
        {
          tight: true,
          depth: 3,
        },
      ],
    ],
  },
});
