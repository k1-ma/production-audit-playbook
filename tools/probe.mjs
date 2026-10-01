// Point probe: what is actually computed for one element, and why.
//
// Use it when a value looks correct in the source and wrong on screen. The usual
// answer is one of the three things this prints and a stylesheet does not:
// the resolved computed value, the opacity accumulated up the ancestor chain,
// and what the named CSS custom properties actually hold at that point.
//
// The accumulated opacity is the one that catches people. A token can be exactly
// right while an ancestor sits at 0.6, and nothing in the element's own styles
// says so.
//
// Usage:
//   node probe.mjs <path> <selector> [--props "--fg-muted,--surface"]
//                  [--base URL] [--state FILE] [--width N]
//                  [--prefs-key KEY] [--prefs JSON] [--wait MS]
//
// Example:
//   node probe.mjs /settings ".field-hint" --props "--fg-muted,--fg-subtle"

import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const path = argv[0];
const selector = argv[1];
if (!path || !selector || path.startsWith('--') || selector.startsWith('--')) {
  console.error('usage: node probe.mjs <path> <selector> [--props "--a,--b"] [--base URL] [--state FILE] [--width N] [--prefs-key KEY] [--prefs JSON] [--wait MS]');
  process.exit(1);
}

const BASE = flag('base', process.env.AUDIT_BASE_URL || 'http://localhost:5173');
const STATE = flag('state', process.env.AUDIT_STORAGE_STATE || '');
const WIDTH = +flag('width', 1440);
const WAIT = +flag('wait', 5000);
const PROPS = (flag('props', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const PREFS_KEY = flag('prefs-key', process.env.AUDIT_PREFS_KEY || '');
const PREFS = flag('prefs', process.env.AUDIT_PREFS || '');

const browser = await chromium.launch(
  process.env.AUDIT_CHROMIUM ? { executablePath: process.env.AUDIT_CHROMIUM } : {},
);
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 900 },
  ...(STATE ? { storageState: STATE } : {}),
});

if (PREFS_KEY && PREFS) {
  await ctx.addInitScript(
    ([k, v]) => { try { localStorage.setItem(k, v); } catch {} },
    [PREFS_KEY, PREFS],
  );
}

const page = await ctx.newPage();
await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(WAIT);

const result = await page.evaluate(
  ([sel, props]) => {
    const els = [...document.querySelectorAll(sel)];
    if (!els.length) {
      return {
        matched: 0,
        note: 'selector matched nothing — the element may be behind a tab, a modal, or not rendered at this viewport',
      };
    }

    const read = (el) => {
      const st = getComputedStyle(el);

      // Opacity multiplies down the tree and each element only reports its own.
      let cumulative = 1;
      let n = el;
      const chain = [];
      while (n) {
        const o = +getComputedStyle(n).opacity;
        if (o !== 1) chain.push({ tag: n.tagName.toLowerCase(), cls: (n.className?.toString() || '').slice(0, 40), opacity: o });
        cumulative *= o;
        n = n.parentElement;
      }

      const rc = el.getBoundingClientRect();
      return {
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        // Printed raw. getComputedStyle returns either rgb()/rgba() on a 0-255
        // scale or color(srgb …) on a 0-1 scale, and reading one as the other is
        // how an instrument invents findings. See README → instrument errors.
        color: st.color,
        backgroundColor: st.backgroundColor,
        backgroundImage: st.backgroundImage === 'none' ? null : st.backgroundImage.slice(0, 80),
        fontSize: st.fontSize,
        fontWeight: st.fontWeight,
        ownOpacity: st.opacity,
        cumulativeOpacity: +cumulative.toFixed(3),
        opacityChain: chain,
        visibility: st.visibility,
        display: st.display,
        rect: { w: Math.round(rc.width), h: Math.round(rc.height), top: Math.round(rc.top) },
        inViewport: rc.top < innerHeight && rc.bottom > 0 && rc.width > 0,
      };
    };

    const rootStyle = getComputedStyle(document.documentElement);
    const tokens = {};
    for (const p of props) tokens[p] = rootStyle.getPropertyValue(p).trim() || null;

    return {
      matched: els.length,
      theme: document.documentElement.getAttribute('data-theme'),
      tokens,
      elements: els.slice(0, 5).map(read),
    };
  },
  [selector, PROPS],
);

console.log(JSON.stringify({ path, selector, ...result }, null, 1));
await browser.close();
