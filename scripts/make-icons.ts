/**
 * Draws the app icons: a white "L" with a minus sign on the primary blue (Bricolage Grotesque).
 * Run: npx tsx scripts/make-icons.ts   (needs the Playwright Chromium). The PNG files are committed.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const BLUE = "#1565C0"; // --color-primary
const font = readFileSync(
  join(
    root,
    "node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  ),
).toString("base64");

/** `safe` = share of the icon that the mark may use (maskable icons keep the mark inside 80%). */
function html(size: number, opts: { radius: number; safe: number }): string {
  const mark = size * opts.safe;
  return `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: "B"; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 200 800; }
html, body { margin: 0; width: ${size}px; height: ${size}px; background: transparent; }
.icon { position: relative; width: ${size}px; height: ${size}px; background: ${BLUE}; border-radius: ${opts.radius}px; overflow: hidden; }
.mark { position: absolute; left: 50%; top: 50%; width: ${mark}px; height: ${mark}px; transform: translate(-50%, -50%); }
.l { position: absolute; left: 0; top: 0; width: 70%; height: 100%; display: flex; align-items: center; justify-content: center;
     font: 800 ${mark * 1.02}px/1 "B", sans-serif; color: #fff; letter-spacing: -0.04em; }
.minus { position: absolute; left: 64%; top: 33%; width: 34%; height: ${mark * 0.1}px; background: #fff; border-radius: ${mark * 0.05}px; }
</style><div class="icon"><div class="mark"><div class="l">L</div><div class="minus"></div></div></div>`;
}

const jobs: { file: string; size: number; radius: number; safe: number }[] = [
  { file: "icon-192.png", size: 192, radius: 40, safe: 0.62 },
  { file: "icon-512.png", size: 512, radius: 108, safe: 0.62 },
  { file: "maskable-512.png", size: 512, radius: 0, safe: 0.5 },
  { file: "apple-touch-icon.png", size: 180, radius: 0, safe: 0.58 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const j of jobs) {
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(html(j.size, j));
  await page.evaluate(() => document.fonts.ready);
  const out =
    j.file === "apple-touch-icon.png" ? "public/apple-touch-icon.png" : `public/icons/${j.file}`;
  await page.screenshot({
    path: join(root, out),
    omitBackground: true,
    clip: { x: 0, y: 0, width: j.size, height: j.size },
  });
  console.log("wrote", out);
}
await browser.close();

writeFileSync(
  join(root, "public/favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${BLUE}"/><path d="M20 14h8v28h16v8H20z" fill="#fff"/><rect x="38" y="19" width="14" height="5" rx="2.5" fill="#fff"/></svg>\n`,
);
console.log("wrote public/favicon.svg");
