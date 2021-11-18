import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import open from "open";

type PixelMatcherOpts = {
  urlA: string;
  urlB: string;
  selectorA: string;
  selectorB: string;
  out: string;
  threshold: number;
};

export async function pixelMatcher({
  urlA,
  selectorA,
  urlB,
  selectorB,
  out,
  threshold,
}: PixelMatcherOpts) {
  // Setup out dir
  const outDir = path.resolve(process.cwd(), out);
  rimraf.sync(outDir);
  mkdirp.sync(outDir);

  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Open given URL
  await page.goto(urlA, { waitUntil: "domcontentloaded" });

  // Capture element A
  const elementA = await page.$(selectorA);
  if (!elementA) {
    throw new Error(`Element not found for selector "${selectorA}"`);
  }
  const bufA = await elementA.screenshot({
    path: path.resolve(outDir, "a.png"),
  });
  const imgA = PNG.sync.read(bufA);

  // Capture element B
  if (urlB !== urlA) {
    await page.goto(urlB, { waitUntil: "domcontentloaded" });
  }
  const elementB = await page.$(selectorB);
  if (!elementB) {
    throw new Error(`Element not found for selector "${selectorB}"`);
  }
  const bufB = await elementB.screenshot({
    path: path.resolve(outDir, "b.png"),
  });
  const imgB = PNG.sync.read(bufB);

  // Get the diff
  const { width, height } = imgA;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    imgA.data,
    imgB.data,
    diff.data,
    width,
    height,
    {
      threshold,
    }
  );
  const matchPercentage = (1 - diffPixels / (width * height)) * 100;
  const diffBuf = PNG.sync.write(diff);
  await fs.promises.writeFile(path.resolve(outDir, "diff.png"), diffBuf);

  // Create HTML file
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  let htmlSrc = await fs.promises.readFile(
    path.resolve(currentDir, "../index.html"),
    "utf8"
  );
  htmlSrc = htmlSrc.replace("__MATCH__", `${matchPercentage.toFixed(3)}%`);
  await fs.promises.writeFile(
    path.resolve(outDir, "index.html"),
    htmlSrc,
    "utf8"
  );

  // Open HTML output
  open(`file://${outDir}/index.html`);

  await browser.close();
}
