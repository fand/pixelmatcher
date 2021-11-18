var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import open from "open";
export function pixelMatcher({ urlA, selectorA, urlB, selectorB, out, threshold, }) {
    return __awaiter(this, void 0, void 0, function* () {
        // Setup out dir
        const outDir = path.resolve(process.cwd(), out);
        rimraf.sync(outDir);
        mkdirp.sync(outDir);
        const browser = yield playwright.chromium.launch();
        const context = yield browser.newContext();
        const page = yield context.newPage();
        // Open given URL
        yield page.goto(urlA, { waitUntil: "domcontentloaded" });
        // Capture element A
        const elementA = yield page.$(selectorA);
        if (!elementA) {
            throw new Error(`Element not found for selector "${selectorA}"`);
        }
        const bufA = yield elementA.screenshot({
            path: path.resolve(outDir, "a.png"),
        });
        const imgA = PNG.sync.read(bufA);
        // Capture element B
        if (urlB !== urlA) {
            yield page.goto(urlB, { waitUntil: "domcontentloaded" });
        }
        const elementB = yield page.$(selectorB);
        if (!elementB) {
            throw new Error(`Element not found for selector "${selectorB}"`);
        }
        const bufB = yield elementB.screenshot({
            path: path.resolve(outDir, "b.png"),
        });
        const imgB = PNG.sync.read(bufB);
        // Get the diff
        const { width, height } = imgA;
        const diff = new PNG({ width, height });
        const diffPixels = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
            threshold,
        });
        const matchPercentage = (1 - diffPixels / (width * height)) * 100;
        const diffBuf = PNG.sync.write(diff);
        yield fs.promises.writeFile(path.resolve(outDir, "diff.png"), diffBuf);
        // Create HTML file
        const currentFilePath = fileURLToPath(import.meta.url);
        const currentDir = path.dirname(currentFilePath);
        let htmlSrc = yield fs.promises.readFile(path.resolve(currentDir, "../index.html"), "utf8");
        htmlSrc = htmlSrc.replace("__MATCH__", `${matchPercentage.toFixed(3)}%`);
        yield fs.promises.writeFile(path.resolve(outDir, "index.html"), htmlSrc, "utf8");
        // Open HTML output
        open(`file://${outDir}/index.html`);
        yield browser.close();
    });
}
