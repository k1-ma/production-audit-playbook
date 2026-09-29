// Screenshot harness for a visual audit.
//
// Takes a JSON job list and captures one full-page image per job, together with
// the console errors and failing API responses that occurred while it loaded —
// so every screenshot arrives with its own evidence instead of just a picture.
//
// Three things here are not obvious and were each learned by ruining a pass.
// See tools/README.md → "Capture rules".
//
// Usage:
//   node shot.mjs <jobs.json> <outDir> [--base URL] [--state FILE] [--width N]
//                                      [--anon] [--hide "sel, sel"]
//                                      [--prefs-key KEY] [--prefs JSON]
//
//   jobs.json: [
//     { "name": "dashboard", "path": "/dashboard" },
//     { "name": "admin-users", "path": "/admin",
//       "click": [{ "text": "Users", "wait": 2600 }] },
//     { "name": "settings-3", "path": "/settings",
//       "click": [{ "sel": "[role=tab]", "n": 2 }] }
//   ]

import { chromium } from '@playwright/test';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const jobsFile = argv[0];
const outDir = argv[1];
if (!jobsFile || !outDir || jobsFile.startsWith('--') || outDir.startsWith('--')) {
  console.error('usage: node shot.mjs <jobs.json> <outDir> [--base URL] [--state FILE] [--width N] [--anon] [--hide "sel, sel"] [--prefs-key KEY] [--prefs JSON]');
  process.exit(1);
}

const BASE = flag('base', process.env.AUDIT_BASE_URL || 'http://localhost:5173');
const STATE = flag('state', process.env.AUDIT_STORAGE_STATE || '');
const WIDTH = +flag('width', 1440);
const ANON = has('anon');
const HIDE = flag('hide', process.env.AUDIT_HIDE_SELECTORS || '');
const PREFS_KEY = flag('prefs-key', process.env.AUDIT_PREFS_KEY || '');
const PREFS = flag('prefs', process.env.AUDIT_PREFS || '');

const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(
  process.env.AUDIT_CHROMIUM ? { executablePath: process.env.AUDIT_CHROMIUM } : {},
);

// RULE 1 — a public surface is captured ONLY with --anon. Signed in as the
// owner you see the authenticated chrome, so whatever an anonymous visitor
// actually gets never appears in the evidence. A whole finding was missed this
// way once: the public page was shot from the owner's session and looked fine.
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 900 },
  ...(ANON || !STATE ? {} : { storageState: STATE }),
});

if (PREFS_KEY && PREFS) {
  await ctx.addInitScript(
    ([k, v]) => { try { localStorage.setItem(k, v); } catch {} },
    [PREFS_KEY, PREFS],
  );
}

// RULE 2 — suppress fixed overlays and dev panels before capturing.
// In a fullPage screenshot anything position:fixed repaints at the scroll
// offset, so a floating dock or a devtools panel lands in the MIDDLE of the
// image and covers exactly the blocks under audit. Capture those elements
// separately in their own viewport-sized shot.
if (HIDE) {
  await ctx.addInitScript((selectors) => {
    const css = document.createElement('style');
    css.textContent = `${selectors}{opacity:0!important;pointer-events:none!important}`;
    const put = () => document.head && document.head.appendChild(css);
    if (document.head) put();
    else document.addEventListener('DOMContentLoaded', put);
  }, HIDE);
}

const report = [];

for (const job of jobs) {
  const { path, name, click, wait } = job;
  const page = await ctx.newPage();
  const errs = [];
  const bad = [];

  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) {
      bad.push(`${r.status()} ${r.url().split('/api/')[1]}`);
    }
  });

  try {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(wait ?? 4200);

    // Click chains: plenty of sub-navigation lives in component state rather
    // than in the URL, so those views are unreachable by path alone. A missing
    // target is reported as a warning, never skipped silently — otherwise the
    // run produces a screenshot of the wrong tab and nobody notices.
    for (const c of click ? [click].flat() : []) {
      const el = c.text
        ? page.getByRole(c.role ?? 'button', { name: c.text }).first()
        : page.locator(c.sel).nth(c.n ?? 0);
      if (await el.count()) {
        await el.click({ timeout: 8000 });
        await page.waitForTimeout(c.wait ?? 2600);
      } else {
        report.push({ name, warn: `no match for ${c.sel ?? c.text}[${c.n ?? 0}]` });
      }
    }

    // Scroll through once so lazy content and deferred images are actually
    // present in the capture, then return to the top.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      const limit = Math.min(document.body.scrollHeight, 14000);
      for (let y = 0; y < limit; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);

    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });

    const h = await page.evaluate(() => document.body.scrollHeight);
    report.push({
      name,
      url: page.url(),
      height: h,
      anon: ANON,
      errors: [...new Set(errs)].slice(0, 3),
      failedRequests: [...new Set(bad)].slice(0, 6),
    });
  } catch (e) {
    report.push({ name, error: e.message.slice(0, 160) });
  }
  await page.close();
}

console.log(JSON.stringify(report, null, 1));
await browser.close();
