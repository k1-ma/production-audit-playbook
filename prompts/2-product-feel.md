# Pass 2 — Product feel and feature depth

> **Use this when** the product works but feels unfinished: controls that render and do
> nothing, screens that show zero while the data exists, internal jargon leaking into the
> interface, features that are a hollow subset of their equivalent elsewhere.
>
> This pass audits **impression and depth**, not correctness. A finding here says both
> what is wrong *and* how it should feel, with a concrete direction.
>
> Read [`../METHOD.md`](../METHOD.md) first — especially
> [seed → generalized rule](../METHOD.md#seed--generalized-rule), which this pass is
> built around. Fill in every `<…>`. Delete this quote block when you paste it.

---

## Role and goal

You are a product engineer walking the application as a demanding user and as the author
of its next revision. For **every** interactive element and screen, answer three
questions:

1. **Does it actually work?** The control changes visible state, the screen shows real
   data, the button does what it promises.
2. **Does it feel finished?** Visual fidelity, density, micro-interactions, copy.
3. **Is it deep enough?** Enough capability for real work — or a stub, or a subset of
   what exists elsewhere in the same product.

Answering from memory is forbidden. Every conclusion is backed by `Read`/`grep` with
`path:line`, and every "works / does not work" by a trace:

```
control → onChange → state → persist → DOM/CSS/network → visible effect
```

## Taxonomy

| Class | Definition |
| --- | --- |
| `dead-control` | Renders, affects nothing — never applied, or applied and no consumer reads it |
| `lying-surface` | Shows 0 / empty / wrong while the data exists |
| `leaked-internal` | Job names, cron schedules, UTC, internal ids, route paths, SQL phrasing, debug tone visible to the user |
| `low-fidelity` | Visually cheap or dishonest: a decorative fake instead of a real representation of the data |
| `shallow-feature` | Exists, but shallow against the product's own best equivalent — or against what the backend already accepts |
| `config-depth` | A "studio" or settings surface that is a dead list instead of a tool: no live preview, no feedback in the moment |
| `admin-polish` | Operator surfaces that do not survive scale: no search, filters, bulk actions, pagination |
| `automation-gap` | A manual routine that obviously should be automated |
| `ux-flow` | Layout or navigation: competing jobs on one scroll, missing tabs or sections |

Severity: `CRIT` the feature looks broken to the user or the data lies · `HIGH` visible
rawness that costs trust · `MED` noticeable but tolerable · `LOW` polish.

## The pattern — this is the whole pass

**Complaints are seeds of patterns, not checklist items.** The screen where something was
noticed is only where it was noticed first. Derive the general rule from each seed and
run it across the entire product.

Write your seeds into this table before running. One row per complaint you have actually
received:

| Seed (what someone reported) | Generalized rule (run everywhere) |
| --- | --- |
| `<the complaint, verbatim>` | `<the rule it generalizes to, plus its class>` |

A starting set that applies to almost any product:

| Seed | Generalized rule |
| --- | --- |
| A settings control changes nothing | **Every** toggle, swatch, select, tab → trace to a visible effect. No effect → `dead-control` |
| A screen shows 0 while records exist | **Every** counter, list, KPI, chart → reconcile against its source. Watch hidden default filters: date range, scope, status → `lying-surface` |
| A technical message reached the UI | **Every** string, in locale files and inline in markup → job names, cron, UTC, routes, SQL, internal ids → `leaked-internal` |
| A widget does not look real | **Every** visual widget, illustration, empty state → judge fidelity → `low-fidelity` |
| Creating a record here is thinner than there | **Every** create/edit flow → compare against the richest equivalent **and against what the backend already accepts**. Keep a separate list of "backend supports it, UI does not expose it" → `shallow-feature` |
| Only presets, cannot enter my own | **Every** selection list → free text possible, or a hardcoded prison? → `shallow-feature` |
| Two jobs compete for one scroll | **Every** long screen → layout and navigation → `ux-flow` |

**Working mode: an exhaustive walk.** Do not stop at the example you were given. For each
screen in the registry below, run **all** the rules in order. Mark a screen walked only
when every rule has been run against it. The goal is not to confirm the complaints — it
is to find the whole class of the same problem everywhere, including screens nobody
mentioned.

## Screen registry

List every screen. Not a representative sample — the full registry, because the sample is
where the skimming starts.

```
<screen 1> · <screen 2> · …
```

Plus the elements that live outside routes: shell and navigation, global toasts, empty
states, onboarding, command menu. Every interactive element in the product must fall under
a control→effect trace at least once.

## Method, per screen

1. **Inventory the controls.** List every interactive element. Trace each to a visible
   effect. No effect → `dead-control`.
2. **Reconcile the data.** Every number and list on screen against its source. Divergence
   → `lying-surface`.
3. **Fidelity and tone.** Visual plausibility, empty states, micro-interactions, copy.
   Hunt `leaked-internal`.
4. **Depth.** Compare the feature against the user's expectation and against its best
   equivalent in the product. Shortfall → `shallow-feature` / `ux-flow`.
5. **Direction.** For each finding, one to three lines of concrete "how it should be",
   compatible with the existing design system and the project's binding rules.

## Output

Markdown grouped by screen. Each finding:

```markdown
### [CRIT|HIGH|MED|LOW] <title>
- **Screen / file:** `path:line`
- **Class:** <from the taxonomy>
- **What the user sees:** the symptom in their words, not yours
- **Evidence:** grep / Read / the control→effect trace
- **How it should feel:** a concrete direction, 1-3 lines
```

At the end:

- Summary table: screen × severity × class.
- **A map of dead controls** — everything that renders and does nothing.
- **A map of lying surfaces** — where the UI disagrees with the data.
- **Top 10 by trust damage** — what to fix first so the product stops feeling raw.
- **"Backend supports it, the UI does not expose it"** — this list is free functionality.

Do not duplicate what pass 1 already recorded. Reference its IDs and add what this pass is
for: the feel, the fidelity, the direction.

## How to run

Fan out by screen group so the whole registry is covered, giving each subagent this file,
its group, and the requirement to run **all** rules against **every** screen in the group.
Then a synthesizer assembles the maps.

> **Completion criterion:** every screen in the registry is marked "all rules run" — not
> "found what the user pointed at". The user's examples are the floor. If the audit found
> only what was reported, it failed.
