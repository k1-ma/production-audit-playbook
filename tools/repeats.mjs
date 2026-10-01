// Count what is actually in the list, to settle a claim about it.
//
// Built to DISPROVE a hypothesis, which is the use that matters. Someone reports
// "the list is showing every row twice". You can read the query, the mapper and
// the component for an hour, or you can count the rendered rows and the distinct
// rendered rows and know in thirty seconds.
//
// It finds the repeating element without being told the class name: the class
// shared by the most siblings is the row. That means it works on an app you have
// never seen, which is the point when the app is a client's.
//
// Also prints every API response the page made, because "the list is wrong" and
// "the endpoint returned it wrong" are different findings with different owners.
//
// Usage:
//   node repeats.mjs <path> [--min N] [--base URL] [--state FILE] [--wait MS]
//                    [--width N] [--prefs-key KEY] [--prefs JSON]
//
// Reading the output:
//   total == 2 × expected and uniq == expected  -> genuinely duplicated
//   total == uniq == expected                   -> the complaint is about something else
//   total == expected, uniq < expected          -> the rows are not distinct; the
//                                                  duplication is in the DATA, not the render

import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const has = (name) => argv.includes(`--${name}`);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const path = argv[0];
if (!path || path.startsWith('--')) {
  console.error('usage: node repeats.mjs <path> [--min N] [--base URL] [--state FILE] [--wait MS] [--width N] [--prefs-key KEY] [--prefs JSON]');
  process.exit(1);
}

const BASE = flag('base', process.env.AUDIT_BASE_URL || 'http://localhost:5173');
const STATE = flag('state', process.env.AUDIT_STORAGE_STATE || '');
const WIDTH = +flag('width', 1440);
const WAIT = +flag('wait', 7000);
const MIN = +flag('min', 10);
const ANON = has('anon');
const PREFS_KEY = flag('prefs-key', process.env.AUDIT_PREFS_KEY || '');
const PREFS = flag('prefs', process.env.AUDIT_PREFS || '');

const browser = await chromium.launch(
  process.env.AUDIT_CHROMIUM ? { executablePath: process.env.AUDIT_CHROMIUM } : {},
);
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

const page = await ctx.newPage();
const api = [];
page.on('response', (r) => {
  if (r.url().includes('/api/')) {
    api.push(`${r.status()} ${r.url().split('/api/')[1].slice(0, 90)}`);
  }
});

await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(WAIT);

const result = await page.evaluate((min) => {
  // The repeating row is the class with the most instances. No knowledge of the
  // app required — which is why this works on a codebase you have not read.
  const counts = {};
  for (const el of document.querySelectorAll('body *')) {
    const cl = (el.className?.toString() || '').trim();
    if (!cl) continue;
    counts[cl] = (counts[cl] || 0) + 1;
  }

  const candidates = Object.entries(counts)
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cls, n]) => ({ cls: cls.slice(0, 70), n }));

  if (!candidates.length) {
    return { candidates: [], note: `nothing repeats ${min} times or more — raise --wait, or the list did not load` };
  }

  const best = candidates[0].cls;
  let rows = [];
  try {
    rows = [...document.querySelectorAll('.' + CSS.escape(best))].map((e) =>
      (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    );
  } catch {
    return { candidates, note: 'could not query the winning class — it may contain characters CSS.escape cannot handle' };
  }

  const uniq = new Set(rows);
  const dupes = {};
  for (const r of rows) dupes[r] = (dupes[r] || 0) + 1;

  return {
    candidates,
    chosen: best,
    total: rows.length,
    uniq: uniq.size,
    repeated: Object.entries(dupes)
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([text, n]) => ({ text, n })),
    sample: rows.slice(0, 8),
  };
}, MIN);

console.log(JSON.stringify({ path, api: [...new Set(api)].slice(0, 10), ...result }, null, 1));
await browser.close();
