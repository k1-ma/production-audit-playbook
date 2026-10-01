// Downscale a screenshot tree so the evidence is actually reviewable.
//
// A full-page capture set at three viewports × two themes runs into tens of
// megabytes of PNG, which nobody opens and no report can carry. Downscaling to
// 1200px wide and re-encoding as JPEG at 0.82 takes a real set from ~27 MB to
// ~6 MB with no loss that matters for judging a layout.
//
// Done through the browser's canvas rather than a native image library, on
// purpose: Playwright is already a dependency of this toolkit, and adding sharp
// or imagemagick to run a resize is a build problem in exchange for nothing.
//
// DESTRUCTIVE: replaces each .png with a .jpg and deletes the original. Run it on
// a copy, or after the shots are committed. Pass --keep to leave the originals.
//
// Usage:
//   node compress.mjs <dir> [--max-width 1200] [--quality 0.82]
//                           [--max-height 6000] [--keep]

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import nodePath from 'node:path';

const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const root = argv[0];
if (!root || root.startsWith('--')) {
  console.error('usage: node compress.mjs <dir> [--max-width 1200] [--quality 0.82] [--max-height 6000] [--keep]');
  process.exit(1);
}
if (!fs.existsSync(root)) {
  console.error(`not found: ${root}`);
  process.exit(1);
}

const MAX_W = +flag('max-width', 1200);
const MAX_H = +flag('max-height', 6000);
const QUALITY = +flag('quality', 0.82);
const KEEP = has('keep');

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = nodePath.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (p.toLowerCase().endsWith('.png')) files.push(p);
  }
})(root);

if (!files.length) {
  console.log('no .png files found');
  process.exit(0);
}

const browser = await chromium.launch(
  process.env.AUDIT_CHROMIUM ? { executablePath: process.env.AUDIT_CHROMIUM } : {},
);
const page = await browser.newPage();

let before = 0;
let after = 0;
let failed = 0;

for (const file of files) {
  const buf = fs.readFileSync(file);
  before += buf.length;
  try {
    const dataUrl = 'data:image/png;base64,' + buf.toString('base64');
    const out = await page.evaluate(
      async ([url, maxW, maxH, quality]) => {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        let w = img.width;
        let h = img.height;
        const scale = Math.min(1, maxW / w, maxH / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', quality);
      },
      [dataUrl, MAX_W, MAX_H, QUALITY],
    );
    const jpg = Buffer.from(out.split(',')[1], 'base64');
    fs.writeFileSync(file.replace(/\.png$/i, '.jpg'), jpg);
    after += jpg.length;
    if (!KEEP) fs.unlinkSync(file);
  } catch (e) {
    failed++;
    after += buf.length;
    console.error(`FAILED ${file}: ${e.message.slice(0, 120)}`);
  }
}

const mb = (n) => (n / 1e6).toFixed(1) + 'MB';
console.log(
  `files ${files.length}` +
    (failed ? ` (${failed} failed, originals kept)` : '') +
    ` · before ${mb(before)} · after ${mb(after)} · saved ${(100 - (after / before) * 100).toFixed(0)}%`,
);
await browser.close();
