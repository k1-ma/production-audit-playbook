# Tools

Five instruments for a visual audit, plus the rules and the mistakes that shaped them.

All are single-file Node scripts over Playwright. None of them is a framework — they are
short enough to read in one sitting and to fork for your own app, which is the point.

```bash
npm install && npm run setup
```

If a script dies with a module-resolution stack trace instead of printing usage, that is the
missing dependency — the import runs before the argument check.

Everything else is passed in. Nothing about a specific app is baked in.

| Flag | Environment | Meaning |
| --- | --- | --- |
| `--base` | `AUDIT_BASE_URL` | Origin of the running app |
| `--state` | `AUDIT_STORAGE_STATE` | Playwright `storageState` file for a signed-in session |
| `--width` | | Viewport width |
| `--anon` | | Ignore the session — capture as an anonymous visitor |
| `--hide` | `AUDIT_HIDE_SELECTORS` | Selectors to suppress before capture |
| `--prefs-key` / `--prefs` | `AUDIT_PREFS_KEY` / `AUDIT_PREFS` | A `localStorage` key and value to pin theme, density and anything else that must be identical between runs |
| | `AUDIT_CHROMIUM` | Explicit Chromium path, if Playwright's own is not usable |

## `shot.mjs`

Full-page capture from a job list, with click chains for views whose sub-navigation
lives in component state rather than in the URL. Every shot comes back with the console
errors and failing API responses recorded while it loaded, so the image arrives with its
own evidence.

```bash
node shot.mjs jobs.json ./shots \
  --base http://localhost:5173 \
  --state ./auth-state.json \
  --hide ".app-dock, [class*='devtools']"
```

```json
[
  { "name": "dashboard",   "path": "/dashboard" },
  { "name": "admin-users", "path": "/admin",    "click": [{ "text": "Users" }] },
  { "name": "settings-3",  "path": "/settings", "click": [{ "sel": "[role=tab]", "n": 2 }] }
]
```

## `contrast.mjs`

Walks every element owning visible text, composites the full translucent background
stack, and reports everything under the WCAG AA threshold for its size and weight.
Identical elements are merged into one finding with a count.

```bash
node contrast.mjs jobs.json --base http://localhost:5173 --state ./auth-state.json
```

Output splits into `firm` — findings over a solid background, trustworthy — and a
`painted` count for elements this instrument cannot measure. See the known limitation
below.

## `probe.mjs`

One element, and why it looks the way it does. Reach for it when a value is correct in the
source and wrong on screen.

```bash
node probe.mjs /settings ".field-hint" --props "--fg-muted,--fg-subtle"
```

It prints the resolved computed values, the named custom properties as they actually
resolve at that point, and — the one that catches people — **the opacity accumulated up the
ancestor chain**, with the chain itself. A token can be exactly right while an ancestor
sits at 0.6, and nothing in the element's own styles says so.

## `repeats.mjs`

Counts what is really in a list, to settle a claim about it. Built to *disprove*: someone
reports "every row appears twice", and you can either read the query, the mapper and the
component for an hour, or count the rendered rows and the distinct rendered rows in thirty
seconds.

```bash
node repeats.mjs /orders --wait 7000
```

It finds the repeating element without being told its class — the class shared by the most
siblings is the row — so it works on an app you have never seen. Reading the output:

| total | uniq | Conclusion |
| --- | --- | --- |
| 2 × expected | expected | Genuinely duplicated in the render |
| expected | expected | The complaint is about something else |
| expected | < expected | The rows are not distinct — the duplication is in the **data** |

It also prints every API response the page made, because "the list is wrong" and "the
endpoint returned it wrong" are different findings with different owners.

## `compress.mjs`

Downscales a screenshot tree so the evidence is reviewable. A set at three viewports × two
themes runs into tens of megabytes of PNG that nobody opens; this takes a real set from
~27 MB to ~6 MB with no loss that matters for judging a layout.

```bash
node compress.mjs ./shots            # replaces .png with .jpg
node compress.mjs ./shots --keep     # leaves the originals
```

**Destructive by default.** Run it on a copy, or after the shots are committed.

---

## Capture rules

Breaking one of these invalidates a run. Each cost a pass.

**1. Public surfaces are captured only with `--anon`.** Signed in as the owner you see
the authenticated chrome, so what an anonymous visitor actually gets never reaches the
evidence. A real finding was missed exactly this way: the public page was shot from the
owner's session and looked correct.

**2. Never screenshot an empty section.** Seed the data first, then capture. Judging an
empty screen as a design is not a small error — it produces confident findings about a
layout that no user will ever see. This is a documented mistake from a real pass, not a
hypothetical.

**3. The number is always checked against the picture.** Both instrument errors below
were caught by exactly this, and by nothing else. A measurement that disagrees with what
you can plainly see is a bug in the instrument until proven otherwise.

---

## Instrument errors

Kept deliberately, with the corrections. Two reasons: somebody will otherwise rebuild the
same broken instrument and rediscover the same wrong numbers — and a report that records
where its own instruments lied is the only kind a reader has grounds to trust.

### 1. `color(srgb …)` read on the 0–255 scale

`getComputedStyle().color` returns **both** of these, depending on how the value was
authored:

```
rgb(231, 236, 247)                          ← 0–255 integers
color(srgb 0.918745 0.788157 0.535686)      ← 0–1 floats
```

The first version of the parser handled only the first form. Every colour authored in the
second was read on the 0–255 scale, turning a light amber into near-black. The tool
produced a page of impossible contrast failures — ratios near 1.0 — on text that is
plainly legible on screen.

Caught by rule 3: the number disagreed with the picture.

### 2. Ancestor walk past translucent layers

The first version walked up the ancestors until it found a background with alpha > 0.85
and **ignored every translucent layer on the way** — which is exactly what a tinted chip,
a glass panel or an overlay is. Same symptom: CR ≈ 1.00 on text anyone can read.

The corrected version collects the whole stack and composites it over the first opaque
ancestor.

### Known limitation, still unfixed

An element sitting on a **painted gradient** (`background-image`) cannot be measured by
an ancestor walk, because the walk cannot read a gradient. Those elements are flagged
`painted` and reported as a separate count rather than silently counted as findings.

This is left unfixed on purpose and stated plainly. An instrument that quietly guesses on
the cases it cannot handle is worse than one that names them.
