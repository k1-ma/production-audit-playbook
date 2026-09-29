# Pass 1 — Correctness, security, layer drift, parity

> **Use this when** you need to know what is broken, unsafe or out of sync. Not when the
> problem is "the product feels unfinished" — that is [pass 2](2-product-feel.md).
>
> Read [`../METHOD.md`](../METHOD.md) first. Fill in every `<…>` before running.
> Delete this quote block when you paste it.

---

## Role and goal

You are a staff engineer auditing `<repository>`:

```
<apps/api      — HTTP layer>
<apps/web      — client>
<packages/db   — schema and migrations>
<packages/shared — validation schemas shared by both>
```

Find and document all of:

1. **Bugs** — runtime errors, logic errors, wrong computations, broken edge cases, race
   conditions, mishandled errors.
2. **Security and integrity holes** — missing ownership checks, IDOR, existence leaks,
   bypassed idempotency, unprotected mutations, missing validation, injection, unsafe
   uploads.
3. **Incomplete work** — controls with no handler, `TODO`/`FIXME`, dead features,
   features present in the schema or API but never wired to the UI, and the reverse.
4. **Layer drift** — disagreement between database schema ↔ validation schema ↔ API ↔
   client queries ↔ UI types ↔ rendered UI. A field present in one layer and absent or
   renamed in another is a finding.
5. **Feature parity between modules** — the same operation, implemented fully in one
   module and stunted in another.

## Parity — the class that needs an example

Parity findings are invisible from inside either module. Nobody files them, so they
accumulate. Give the agent one worked example from your own codebase and then demand the
whole class:

> **Reference example.** In `<module A>`, `<operation>` is a full implementation:
> `<path>` (~N lines) — `<list what it supports>`.
>
> In `<module B>`, the same operation is `<path:lines>` — `<what it is reduced to>`.
>
> → That is a parity violation: `<module B>` should reuse the same component or pattern,
> or the reduction should be explicitly justified.

**Find every comparable case in the project, not just this one.** Candidate pairs are
anywhere the same concept exists twice: two entity types with the same shape, the same
attachment or tagging or linking mechanism implemented per-entity, create/edit forms
across routes.

## Scope

Walk **every** domain. For each: API route, validation schema, database schema, client
queries, routes and components.

```
<domain 1>
<domain 2>
…
```

> Produce this list from the code, not from memory — enumerate the route files, the
> schema files and the API handlers, and reconcile the three. A domain present in two of
> the three is already a finding.

## Method, per domain

1. **Trace the layers.** Map fields across database schema ↔ validation schema ↔ API
   routes ↔ client queries ↔ UI. Any field in one layer and not another, or renamed in
   transit, is drift.
2. **Every write endpoint.** Ownership (`user_id` equals the session user), idempotency,
   transactions, soft delete, validation. A missing ownership check is P0.
3. **UI completeness.** Controls with no handler, permanently disabled elements,
   `TODO`/`FIXME`/`stub`/`not implemented`, mock data reaching production, links carrying
   parameters the destination never reads.
4. **Computations.** Independently recompute every domain calculation. Check division by
   zero, rounding, float accumulation, units (percent vs fraction), decimal precision in
   the database, and **whether the same metric agrees across different screens**.
5. **Parity.** For each pair of comparable operations, judge whether the capabilities are
   equivalent, and record the gap.
6. **Project rules.** Check compliance with `<your architecture rules>`. Read-modify-write
   over a collection (`[...items, newOne]` written back whole) deserves its own sweep.
7. **Localization.** Keys rendered raw, strings hardcoded in markup, gaps between locales.

## What is not a finding

- Anything already documented in `<your existing issue docs>`. Reconcile and do not
  duplicate — reference the existing entry and extend it instead.
- Deliberate decisions documented as such in the binding documents. List them explicitly
  in the prompt so they are not rediscovered every pass:
  ```
  <decision 1 — why it looks like a bug, why it is intentional>
  ```

## Output

Markdown grouped by domain, using the finding template in
[`../templates/finding.md`](../templates/finding.md).

At the end:

- Summary table: domain × severity.
- Top 10 by blast radius.
- **A parity map** as its own list — this is the part no other audit produces.
- **Systemic themes**: where many findings share one root cause.

**Verify every quotation with a real `Read`/`grep`. No guesses.**

## How to run

- **Fan out (recommended).** One subagent per domain or group, each with this whole file
  plus its domain. Then a synthesizer deduplicates, reconciles against previous reports,
  and assembles the summary tables and the parity map.
- **Single pass.** Give the agent this file whole. Check coverage strictly — see
  [`../templates/coverage.md`](../templates/coverage.md).
