// Contrast audit over a running app.
//
// Walks every element that owns visible text, computes its effective foreground
// and background, and reports everything under the WCAG AA threshold for its
// size and weight.
//
// Two bugs are baked into this file's history on purpose. Both produced pages of
// confident, entirely wrong findings before they were caught, and both are the
// kind of thing you rediscover the hard way if the corrected version is all you
// ever see. See tools/README.md → "Instrument errors".
//
// Usage:
//   node contrast.mjs <jobs.json> [--base URL] [--state FILE] [--width N]
//                                 [--prefs-key KEY] [--prefs JSON]
//
//   jobs.json:  [{ "name": "dashboard", "path": "/dashboard" }, …]
//
// Output: JSON to stdout. `firm` are findings over a solid background —
// trustworthy. `painted` counts elements sitting on a background-image, which
// this instrument cannot read (see the known limitation in the README).

import { chromium } from '@playwright/test';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const jobsFile = argv[0];
if (!jobsFile || jobsFile.startsWith('--')) {
  console.error('usage: node contrast.mjs <jobs.json> [--base URL] [--state FILE] [--width N] [--prefs-key KEY] [--prefs JSON]');
  process.exit(1);
}

const BASE = flag('base', process.env.AUDIT_BASE_URL || 'http://localhost:5173');
const STATE = flag('state', process.env.AUDIT_STORAGE_STATE || '');
const WIDTH = +flag('width', 1440);
const PREFS_KEY = flag('prefs-key', process.env.AUDIT_PREFS_KEY || '');
const PREFS = flag('prefs', process.env.AUDIT_PREFS || '');

const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));

const browser = await chromium.launch(
  process.env.AUDIT_CHROMIUM ? { executablePath: process.env.AUDIT_CHROMIUM } : {},
);
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 900 },
  ...(STATE ? { storageState: STATE } : {}),
});

// Pin theme/density so a run is reproducible and two runs are comparable.
if (PREFS_KEY && PREFS) {
  await ctx.addInitScript(
    ([k, v]) => { try { localStorage.setItem(k, v); } catch {} },
    [PREFS_KEY, PREFS],
  );
}

const out = [];

for (const job of jobs) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + job.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(job.wait ?? 4500);

    const rows = await page.evaluate(() => {
      // ── INSTRUMENT ERROR 1 ────────────────────────────────────────────────
      // getComputedStyle().color returns BOTH of these, depending on how the
      // value was authored:
      //
      //     rgb(231, 236, 247)                        ← 0–255 integers
      //     color(srgb 0.918745 0.788157 0.535686)    ← 0–1 floats
      //
      // The first version parsed only the first form. Every colour authored in
      // the second was read on the 0–255 scale, so a light amber came out as
      // near-black, and the tool reported a page of impossible contrast
      // failures on text that is plainly legible on screen.
      const rgba = (s) => {
        const m = s.match(/[\d.]+/g);
        if (!m) return null;
        const f = /^color\(/.test(s) ? 255 : 1;
        return [+m[0] * f, +m[1] * f, +m[2] * f, m.length > 3 ? +m[3] : 1];
      };

      const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));

      const lum = (c) => {
        const s = c.map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
      };

      // ── INSTRUMENT ERROR 2 ────────────────────────────────────────────────
      // The first version walked up the ancestors until it met a background
      // with alpha > 0.85 and IGNORED every translucent layer on the way —
      // which is exactly what a tinted chip, a glass panel or an overlay is.
      // It reported CR ≈ 1.00 for text that anyone can read.
      //
      // This version collects the whole translucent stack and composites it
      // over the first opaque ancestor.
      //
      // KNOWN LIMITATION, still unfixed: an element sitting on a painted
      // gradient (background-image) cannot be measured this way — an ancestor
      // walk cannot read a gradient. Those elements are flagged `painted` and
      // reported separately rather than silently counted as findings.
      const bgOf = (el) => {
        const stack = [];
        let n = el;
        let painted = false;
        while (n) {
          const st = getComputedStyle(n);
          if (st.backgroundImage && st.backgroundImage !== 'none') painted = true;
          const bg = rgba(st.backgroundColor);
          if (bg && bg[3] > 0) {
            stack.push(bg);
            if (bg[3] >= 0.999) break;
          }
          n = n.parentElement;
        }
        let base = [255, 255, 255];
        for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
        return [base, painted];
      };

      const low = [];
      for (const el of document.querySelectorAll('body *')) {
        // Only elements owning their own text nodes, so a wrapper is not
        // credited with its children's text.
        const text = [...el.childNodes]
          .filter((x) => x.nodeType === 3)
          .map((x) => x.textContent.trim())
          .join(' ')
          .trim();
        if (!text || text.length < 2) continue;

        const st = getComputedStyle(el);
        const rc = el.getBoundingClientRect();
        if (rc.width < 2 || rc.height < 2 || st.visibility === 'hidden' || +st.opacity === 0) continue;

        const fgc = rgba(st.color);
        if (!fgc) continue;

        const [bg, painted] = bgOf(el);
        const fg = fgc[3] < 1 ? over(fgc, bg) : fgc.slice(0, 3);

        const L1 = lum(fg);
        const L2 = lum(bg);
        const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);

        const px = parseFloat(st.fontSize);
        const bold = parseInt(st.fontWeight) >= 700;
        const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;

        if (cr < need) {
          low.push({
            text: text.slice(0, 40),
            cr: +cr.toFixed(2),
            need,
            px: +px.toFixed(1),
            painted,
            fg: fg.map(Math.round),
            bg: bg.map(Math.round),
            cls: (el.className?.toString() || '').slice(0, 34),
          });
        }
      }

      // Twelve identical chips are one finding with a count, not twelve findings.
      const merged = {};
      for (const x of low) {
        const key = `${x.cls}|${x.cr}`;
        (merged[key] ??= { ...x, n: 0 }).n++;
      }
      return Object.values(merged).sort((a, b) => a.cr - b.cr);
    });

    out.push({
      name: job.name,
      firm: rows.filter((x) => !x.painted),
      painted: rows.filter((x) => x.painted).length,
    });
  } catch (e) {
    out.push({ name: job.name, error: e.message.slice(0, 160) });
  }
  await page.close();
}

console.log(JSON.stringify(out, null, 1));
await browser.close();
