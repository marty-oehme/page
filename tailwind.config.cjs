/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // Remove above once tailwindcss exposes theme type
      typography: (theme) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--theme-base-content)",
            "--tw-prose-headings": "var(--theme-accent)",
            "--tw-prose-links": "var(--theme-secondary)",
            "--tw-prose-bold": "var(--theme-base-content)",
            "--tw-prose-bullets": "var(--theme-base-content)",
            "--tw-prose-quotes": "var(--theme-neutral)",
            "--tw-prose-code": "var(--theme-text)",
            "--tw-prose-hr": "0.5px dashed #666",
            "--tw-prose-th-borders": "#666",
          },
        },
      }),
    },
    colors: {
      primary: "var(--theme-primary)",
      "primary-focus": "var(--theme-primary-focus)",
      "primary-content": "var(--theme-primary-content)",
      secondary: "var(--theme-secondary)",
      "secondary-focus": "var(--theme-secondary-focus)",
      "secondary-content": "var(--theme-secondary-content)",
      accent: "var(--theme-accent)",
      "accent-focus": "var(--theme-accent-focus)",
      "accent-content": "var(--theme-accent-content)",
      neutral: "var(--theme-neutral)",
      "neutral-focus": "var(--theme-neutral-focus)",
      "neutral-content": "var(--theme-neutral-content)",
      "base-100": "var(--theme-base-100)",
      "base-200": "var(--theme-base-200)",
      "base-300": "var(--theme-base-300)",
      "base-content": "var(--theme-base-content)",
      "color-scheme": "var(--theme-color-scheme)",
      baselight: "#fff0f0",
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
