#!/usr/bin/env node
/**
 * Render the committed PNG fallbacks for Astro Lets-Plot figures.
 *
 * Usage:
 *   yarn plot-png content/2025-12-13-popcorn-analysis/plot_json
 *
 * The same Lets-Plot build and the same processed JSON spec used by the
 * browser are rendered headlessly, so the fallback matches the interactive
 * chart. Images are written next to their JSON files.
 *
 * Requires Playwright's Chromium:
 *   yarn playwright install chromium
 *
 * Override the browser binary when Chromium is installed system-wide:
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium yarn plot-png <dir>
 *
 * In minimal containers without system fonts, point fontconfig at a font
 * directory so axis labels and titles are not rendered blank.
 */
import { chromium } from "playwright";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PLOT_WIDTH = 704; // content width of max-w-3xl minus px-8
const DEVICE_SCALE_FACTOR = 2;
const LETS_PLOT_URL =
  "https://cdn.jsdelivr.net/gh/JetBrains/lets-plot@v4.7.3/js-package/distr/lets-plot.min.js";

const dir = process.argv[2];

if (!dir) {
  console.error("Usage: yarn plot-png <plot_json-directory>");
  process.exit(1);
}

const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();

if (files.length === 0) {
  console.error(`No .json specs found in ${dir}`);
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  args: process.env.PLAYWRIGHT_NO_SANDBOX === "1" ? ["--no-sandbox"] : [],
});

const page = await browser.newPage({
  viewport: { width: PLOT_WIDTH, height: 800 },
  deviceScaleFactor: DEVICE_SCALE_FACTOR,
});

page.on("pageerror", (error) => {
  console.error("Page error:", error.message);
});

for (const file of files) {
  const specPath = resolve(dir, file);
  const pngPath = specPath.replace(/\.json$/, ".png");
  const spec = JSON.parse(await readFile(specPath, "utf8"));

  await page.setContent(
    '<!doctype html><html><body style="margin:0;background:#fff"><div id="plot"></div></body></html>',
  );
  await page.addScriptTag({ url: LETS_PLOT_URL });
  await page.evaluate(
    ({ spec, width }) => {
      window.LetsPlot.buildPlotFromProcessedSpecs(spec, document.getElementById("plot"), {
        width_mode: "FIXED",
        height_mode: "SCALED",
        width,
        height: null,
      });
    },
    { spec, width: PLOT_WIDTH },
  );

  // Lets-Plot 4.7 renders SVG; newer versions may render a canvas.
  await page.waitForSelector("#plot svg, #plot canvas", {
    state: "attached",
  });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );

  await page.locator("#plot").screenshot({ path: pngPath });
  console.log(`${file} -> ${pngPath}`);
}

await browser.close();
