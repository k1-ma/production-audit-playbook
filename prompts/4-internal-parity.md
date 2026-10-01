# Pass 4 — Internal parity: design · capability · data truthfulness

> **Use this when** the product was built in waves and it shows: some screens are
> polished, some stopped at "we put a table there and moved on", and some run on
> fabricated data that looks real.
>
> **The reference is not your taste. It is this product's own best pages.** You do not
> bring in design from outside. You find the internal ceiling and pull everything else up
> to it. (When the ceiling itself is the problem, that is [pass 5](5-absolute-bar.md),
> which revokes this rule deliberately.)
>
> Principle: **Find the gap. Prove the gap. Score the gap. Close the gap.**
>
> Read [`../METHOD.md`](../METHOD.md) first. Fill in every `<…>`. Delete this quote block.

---

## 0. Run mode

Declare it in your first message. `R` research-only (default) or `RF` research + safe fix,
with the lists in §7. Details: [run modes](../METHOD.md#run-modes).

## 1. Hard constraints

1. **Nothing from memory, and nothing from a file name.** Every claim carries
   `path:line`, a route, a screenshot or a network response. *"There's probably a mock
   here"* is not a finding. *"`MarketTicker.tsx:51-70` holds a `FALLBACK_ITEMS` array with
   fixed prices, rendered until the response arrives, and `/api/market-ticker` currently
   returns an error in production — log attached"* is a finding.
2. **The reference is not improved in this pass.** The pages you designate as the
   reference are the ruler, not the object of work. Wanting to change the ruler is its own
   finding, status `needs-owner-decision`.
3. **Delta, not redesign.** A proposal is the minimum change that reaches parity with the
   reference — swap a custom control for the shared primitive, add the skeleton, move a
   hardcoded value to a token, finish the empty state. Anything requiring the screen to be
   redrawn is tagged `needs-redesign`, described in words plus a sketch, and handed to the
   owner **with no work done on it**.
4. **Project rules are the frame.** A proposal that violates them is rewritten into an
   allowed pattern before it is written down.
5. **Read-only against production.** Open pages, inspect responses. No mutations. No
   secrets or personal data in the reports.
6. **No product decisions.** "Should this section exist at all" is
   `NEEDS PRODUCT DECISION` with options and consequences.

## 2. Subject and the three axes

Everything a human sees: `<routes>` · `<components>` · `<marketing site>` ·
public surfaces (shared links, public pages, email templates, OG images, meta) ·
`<locale files>` — text is design too.

Three gaps, looked for simultaneously on every screen:

| Axis | Question | Example |
| --- | --- | --- |
| **A — design** | Does this screen look like it came from an earlier era of the product? | A table with no skeleton; a custom button with a hardcoded colour instead of the shared primitive; missing hover/focus; its own radius and spacing |
| **B — capability** | Does this screen do noticeably less than its siblings? | One entity has filters, bulk actions and export; a comparable one has only a list. No pagination where there are hundreds of rows. No empty state with a call to action |
| **C — truthfulness** | Is the number or picture on screen actually true? | A ticker rendering a fallback array; prices hardcoded in markup that disagree with the API; product screenshots taken on an old UI |

**One finding = one axis.** A screen that fails all three produces three findings sharing
a tag. Mixing axes in one finding makes it unschedulable.

## 3. Stage 1 — derive the reference, before any judgement

Skip this and the audit becomes "I don't like it".

### 3.1 Candidates

Derive them mechanically. Rank pages by recency and density of work:

```bash
git log --since="6 months ago" --name-only -- <client source path>
```

Intersect with: where the richer shared components are used; where skeleton, empty and
error states already exist; where tests exist.

Pick **2–4 reference pages** and record **why those**, with code.

### 3.2 Extract the design system *from* the reference → `00-design-baseline.md`

Not "principles of good design". Actual values, pulled out of the reference files and the
style configuration:

palette and which tokens are really used, and which colours bypass tokens · type scale,
weights, line heights, font families (is the marketing font the same as the app font?) ·
grid and density: card padding, gaps, table row height, container width · radii, borders,
shadows, blur, gradients — concrete values · control states: default / hover / active /
focus-visible / disabled / loading · screen states: loading (skeleton or spinner?), empty
(with a CTA?), error (with retry?), zero-data, no-permission, long-text overflow, very
large data sets · motion: durations, easing, respect for reduced motion · iconography: one
set or a zoo · mobile: at which breakpoint and how it reflows · the reference's
accessibility floor: contrast, focus ring, aria on interactive elements, touch target size.

End the section with a **30–50 point parity checklist**, every item citing a reference
`path:line` as its exemplar.

> **The rule that makes this work: an item you cannot confirm from the reference's own
> code does not go into the checklist.** That is the entire defense against importing
> taste from outside and calling it an audit.

### 3.3 Reference for capability

The same for axis B. Write out the full capability set of the richest entity in the
product:

```
create · read · update · delete · restore · duplicate · bulk · filter · sort · search ·
paginate/virtualize · export · share · deep-link · keyboard · mobile · optimistic ·
undo · permissions/visibility · empty state with CTA
```

That is the product's own maximum. Every other entity is measured against it, marked
**present / partial / absent / not applicable (with justification)**.

## 4. Stage 2 — inventory and the gap matrix → `01-inventory.md`

Every screen × the checklists above:

| Field | What to record |
| --- | --- |
| Route / file | path + key components |
| Who sees it | guest / user / admin / public link / demo mode |
| Frequency | main path / regular / rare / utility |
| Design score | checklist items passed (n/N) |
| Capability score | n/N, for what applies to this entity |
| Truthfulness | OK / FALLBACK / STALE / FAKE |
| **Tier** | **S** reference · **A** minor divergence · **B** noticeably behind · **C** from another era · **D** looks unfinished — embarrassing to show |
| Last touched | date + commit |

Plus, as their own lists: screens that **exist in code but are unreachable from the UI** ·
screens reachable but not translated into every locale · screens with no test · duplicate
components (two kinds of card, three kinds of empty state, bespoke controls instead of the
shared ones) with every location · orphans that nothing imports.

## 5. Axis B — the capability gap

Beyond the matrix, hunt specifically for:

- **dead controls** — the control exists, the handler is missing or empty. Trace
  `control → handler → mutation → API → SQL → cache invalidation → render`
- **one-way features** — can create, cannot edit; can delete, cannot restore while a trash
  screen exists
- **admin vs user gap** — the admin surface can do things the user surface cannot, and the
  reverse
- **product vs marketing gap** — the marketing site promises a feature the product lacks or
  hides; and the reverse, a strong feature the marketing site never shows. Both are findings
- **depth** — filters exist but do not persist; export exists but ignores selected columns;
  sharing exists but has no preview; search exists but does not search the notes
- **inconsistent patterns** — deletion is confirmed by a modal here and immediate there;
  saving is a button here and automatic there

## 6. Axis C — data truthfulness

The rule: **every number, label, chart and image on screen is traced to its source.**
Untraceable is a finding.

### 6.1 How to find it

1. Grep the whole codebase and **examine every hit** — do not report a count:
   `mock` `fake` `dummy` `sample` `placeholder` `demo` `stub` `fixture` `lorem` `TODO`
   `hardcod` `temporar` `for now` `fallback` `seed` `example` `Math.random`, and fixed
   dates passed to a date constructor.
2. Static arrays and objects in components that reach the render path, not the tests.
3. Numbers sitting in markup with no source: percentages, prices, counters,
   "12,000 users", ratings, averages.
4. Components that **should** call an API and contain no request at all.
5. **What production actually returns.** Open the page and inspect the responses. The feed
   can be dead while the code is alive — and this is the check agents skip most often,
   concluding "the feed works" from reading the code.

### 6.2 Classify every hit

| Class | What it is | What to do |
| --- | --- | --- |
| **LEGIT** | An honest fallback nobody would mistake for fact — an avatar placeholder, an example inside a hint, a clearly labelled demo | Not a finding, but record it in the register |
| **FALLBACK-LIE** | The fallback looks like live data: plausible numbers, no label, the user believes it | **Finding, P1 minimum** |
| **STALE** | It was true once: outdated screenshots, prices, plans, "last updated" | Finding |
| **FAKE** | There is no data and never was; the number is invented | **P0 on a public surface** |
| **DRIFT** | The same number in two places, and they disagree — page vs API, marketing vs product, one service vs another | Finding, and name the source of truth |

For every axis-C finding, record: **what the user sees** (screenshot or quote), **what they
will believe**, **what disproves it** (`path:line` plus the network response), and **the
cost of the error** — reputation, support load, or a money decision made on a false number.

## 7. What you fix, what you only propose (RF mode)

**List A — may fix, as a delta, without changing layout:** hardcoded colours and spacing →
tokens · custom control → the shared primitive · skeleton/empty/error states modelled on
the reference · `focus-visible` and `aria-label` · reduced-motion support · missing and raw
locale keys · one number and date format · horizontal scroll and clipping · dead code and
unreachable mocks · labelling or hiding fallback data **once the owner has chosen the
option** · tests for all of the above.

**List B — proposal only, with a mockup:** any change to layout or hierarchy · a new
feature or control · marketing copy · removing or replacing a section · data model or API
contract changes · everything tagged `needs-redesign` or needing a product choice.

> **Conflict rule: if a list-A fix requires even one list-B step, the whole thing goes
> to B.**

## 8. Evidence

1. **Code read whole.** The route and its key components, completely. Grep locates; it
   never concludes.
2. **Visually.** For every tier B/C/D screen: at least 3 viewports × theme ×
   (populated / empty). Store under `shots/<route>-<viewport>-<state>.png` and link from
   the finding. The harness is in [`../tools/`](../tools/README.md) — and so are the
   capture rules, which invalidate a run when broken.
3. **Over the network.** For axis C, what actually arrived: status, timing, cache headers.
   For dead controls, whether a request happens at all.
4. **Comparatively.** Phrase every finding as a delta to the reference: *"the reference at
   `A.tsx:NNN` renders a skeleton; `B.tsx:NNN` renders nothing until the response, hence a
   600 ms white jump."*

## 9. Scoring

- **Impact** 1–5 — how much it misleads or obstructs
- **Visibility** 1–5 — how often and by whom it is seen. Public surface on the main path = 5;
  an admin sub-screen = 1
- **Effort** 1–5 — 1 is under an hour, 5 is a week or more
- **Score = Impact × Visibility ÷ Effort**

Priority: **P0** a lie on a public surface or a plainly broken screen · **P1** tier C/D on
the main path · **P2** tier B and systemic duplication · **P3** cosmetics and rare screens.

Required cuts in the report: top 10 **cheap and highly visible** · top 5 **expensive but
changes how the product feels** · **systemic** findings, where one cause reaches many
screens (no shared empty state, no skeleton kit, no single number format). Systemic ranks
above pointwise, because it is fixed once.

## 10. Finding template

```markdown
### [A|B|C]-NN — <short name>
Axis: design | capability | truthfulness        Priority: P0..P3
Screen: <route>        Seen by: <role>          Tier: S/A/B/C/D
Files: path:line, path:line
Evidence: <code quote / API response / screenshot path>
What the user sees: <what is actually on screen>
Reference: <path:line of the exemplar, and how it behaves there>
Delta: <the minimum change that reaches parity>
Fix: <specifically what to replace or add, which files>
Fix risk: <what could break, how to check>
Impact/Visibility/Effort/Score: n/n/n = n
Status: ready-to-fix | needs-redesign | needs-product-decision | UNCONFIRMED
```

## 11. Order of work

1. Declare the mode and the boundaries.
2. `00-design-baseline.md` — the reference and the checklist. **Show the owner before
   continuing.** If the reference is wrong, every later step is wasted.
3. `01-inventory.md` — the matrix and tiers for every route.
4. Axes A/B/C per screen, starting with the most visible.
5. `05-systemic.md` — collapse the pointwise into the systemic.
6. Scoring, roadmap, two-page summary.

## 12. Definition of done

- Every route has a row in the matrix and a tier.
- Every tier B/C/D screen has at least one finding, or an explicit "behind only in X".
- The axis-C register covers **every** hit from §6.1, each with a class.
- Every finding is scored and has either a `Fix` or a blocking status.
- The summary answers, in five minutes: what is embarrassing to show, where we are lying
  to the user, what to pull up first, and what it costs.
