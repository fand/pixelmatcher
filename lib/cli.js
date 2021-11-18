#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { pixelMatcher } from "./index.js";
import meow from "meow";
const usage = `
  Pixelmatcher - Capture DOM elements and check diffs

  Usage:
    $ pixelmatcher <URL> <selectorA> <selectorB>

  Options:
    --out, -o       Set output directory (default: out)
    --threshod, -t  Set threshold for diffs (default: 0.1)

  Examples:
    $ pixelmatcher http://localhost:3000/ '#foo' '#bar'
    $ pixelmatcher https://example.com/a '#foo' https://example.com/b '#bar'
    $ pixelmatcher http://localhost:3000/ '#foo' '#bar' -t 0.03
`;
const cli = meow(usage, {
    importMeta: import.meta,
    flags: {
        out: {
            type: "string",
            alias: "o",
            default: "out",
        },
        threshold: {
            type: "number",
            alias: "t",
            default: 0.1,
        },
    },
});
if (!(cli.input.length === 3 || cli.input.length === 4)) {
    console.log(usage);
    process.exit(1);
}
const isShort = cli.input.length === 3;
const [urlA, selectorA, urlB, selectorB] = isShort
    ? [process.argv[2], process.argv[3], process.argv[2], process.argv[4]]
    : process.argv.slice(2);
const { out, threshold } = cli.flags;
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield pixelMatcher({ urlA, selectorA, urlB, selectorB, out, threshold });
}))();
