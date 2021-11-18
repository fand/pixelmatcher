const playwright = require("playwright");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const pixelmatch = require("pixelmatch");
const PNG = require("pngjs").PNG;
const open = require("open");

const outDir = path.resolve(process.cwd(), "out");
rimraf.sync(outDir);
mkdirp.sync(outDir);

const url = process.argv[2];
const selectorA = process.argv[3];
const selectorB = process.argv[4];

(async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Open given URL
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Capture element A
  const elementA = await page.$(selectorA);
  const bufA = await elementA.screenshot({
    path: path.resolve(outDir, "a.png"),
  });
  const imgA = PNG.sync.read(bufA);

  // Capture element B
  const elementB = await page.$(selectorB);
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
      threshold: 0.1,
    }
  );
  const matchPercentage = 1 - diffPixels / (width * height);
  const diffBuf = PNG.sync.write(diff);
  await fs.promises.writeFile(path.resolve(outDir, "diff.png"), diffBuf);

  // Create HTML file
  let htmlSrc = await fs.promises.readFile(
    path.resolve(__dirname, "index.html"),
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
})();
