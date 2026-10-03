/**
 * Theme plumbing shared between the pre-paint boot script and the interactive
 * toggle.
 *
 * Asto renders all pages light by default; the `dark` class on <html> switches
 * the CSS custom properties, and `data-theme` selects the matching Expressive
 * Code (shiki) colors for syntax blocks. The boot script re-derives the
 * user's stored or system preference before first paint, which is what
 * prevents the light-theme flashbang.
 */
const CODE_LIGHT_THEME = "everforest-light";
const CODE_DARK_THEME = "everforest-dark";

/** Inline script run in <head>, deciding the initial theme before first paint. */
export const themeScript = `
try {
  const stored = localStorage.getItem("theme");
  const dark = stored
    ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = dark
    ? "${CODE_DARK_THEME}"
    : "${CODE_LIGHT_THEME}";
} catch (error) {
  console.error("Could not set initial site theme", error);
}
`;

/** Set the syntax-highlighting theme to match the current color scheme. */
export function setCodeTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? CODE_DARK_THEME : CODE_LIGHT_THEME;
}
