# Pass 3 — Full line-by-line sweep

> **Use this when** you want exhaustive coverage of the whole codebase, with measured
> baselines, numbered performance work, infrastructure and data integrity, and scored
> proposals for new functionality.
>
> This is the expensive one. Budget is not the constraint; **coverage** is. Partial
> coverage is a failed audit, not a smaller one.
>
> Read [`../METHOD.md`](../METHOD.md) first — this prompt is its direct application.
> Fill in every `<…>`. Delete this quote block when you paste it.

---

## 0. Run mode — chosen by the owner before starting

Declare the mode in your first message and do not step outside it.

| Mode | What it does |
| --- | --- |
| **R — research only** *(default)* | Reads and reports. Not one line of product code. Even a P0 becomes a finding with a ready patch plan. |
| **RF — research + safe fix** | The same, plus you fix confirmed defects from **list A** and write regression tests. Everything in **list B** stays a proposal. |

In RF, every fix is a separate commit referencing a finding ID, and no fix is declared
done without verification (§9.3).

Lists A and B: [`../METHOD.md`](../METHOD.md#run-modes).

## 1. Hard constraints

Violating any of these makes the work defective.

1. **Do not touch the existing page design.** Improvements are deltas against the current
   layout. Anything needing a redesign is tagged `needs-redesign` and handed to the owner.
2. **No conclusions from memory.** Every statement carries `path:line`. Every
   works/does-not-work claim carries the trace
   `control → handler → query/mutation → API → SQL → response → render`.
3. **`<your architecture rules>` are the frame, not the topic.** A proposal that would
   violate them is rewritten into an allowed pattern before it is written down.
4. **Committed migrations are immutable.** Fix an old migration with a new idempotent one.
   In R mode, no migrations are created — only described.
5. **Nothing destructive.** No production data operations, no secrets published, no
   automatic infrastructure changes. Dangerous steps become a deploy plan with a rollback.
6. **Product decisions are not yours.** Ambiguous behaviour → `NEEDS PRODUCT DECISION`
   with options and consequences.

## 2. Stage 1 — discovery and baseline, before any conclusions

### 2.1 Discovery → `00-discovery.md`

**Do not assume you know the product.** The repository's documentation consists of
*claims*, not truth. See
[two kinds of document](../METHOD.md#two-kinds-of-document).

- Binding: `<your architecture and stack documents>`
- Verifiable claims: README, handover notes, tech-debt lists, every previous audit,
  changelog entries, comments, **and file and entity names**

Reconstruct from the code: repository structure, routes, components, API endpoints,
schemas, migrations, seeds, validation schemas, locales, environment examples,
CI configuration, tests, background jobs.

Record: what the product is and what problem it solves *according to the code*; user
roles, confirmed in code; **which modules are really implemented**, which are partial,
which exist in code but are unreachable from the UI, which are mentioned but absent; the
main user journeys; entities and their relations; external services; **contradictions
between parts of the project**, as their own list, with a judgement about the likely
current source of truth; everything unclear, marked `UNCONFIRMED`.

Do not conclude a feature exists from a file name. Check that it is imported, reachable
and finished. Dead code is a finding.

### 2.2 Baseline → `00-baseline.md`

Run these and record the actual result, using only the
[status vocabulary](../FINDINGS.md#status-vocabulary):

```
<install>      does it install, how long, what warnings
<typecheck>    from the repo ROOT, not per workspace
<lint>
<test>         from the ROOT — a per-workspace run can pass while the pipeline fails
<build>        production build, chunk sizes
<audit>        dependency vulnerabilities by severity
```

Also record: stack and versions, package manager, ORM, migration system, auth, external
services, file storage, deployment, CI workflows, logging, monitoring, the last actual
migration versus what the migration journal claims, bundle size, the ten heaviest
dependencies, duplicate libraries, unused and outdated packages, and the number of
requests on first paint of the main screens.

If something could not run, write `BLOCKED: <reason>`. **Never write `PASS` for something
that did not execute.**

## 3. Stage 2 — what is already documented: do not duplicate, but re-verify

Read before walking: `<list your previous audit reports, with dates>`

Produce `00-regression.md` — see
[`../templates/regression.md`](../templates/regression.md). Every previous high-severity
finding gets a status proven against the code. Do not re-describe `OPEN` findings. Check
every `FIXED` one for what the fix broke.

## 4. Scope and coverage accounting

Measure the scope yourself (`find`, `wc -l`) rather than trusting a number in this prompt.

| Layer | Files | Lines |
| --- | ---: | ---: |
| `<client source>` | | |
| `<server source>` | | |
| `<schemas>` | | |
| `<migrations>` | | |
| `<jobs>` | | |
| `<tests>` | | |

**List the largest files explicitly and read them whole.** That is where both the bugs
and the opportunities live, and it is exactly where an agent skims.

Dependencies and generated output are not read line by line — their risk is covered
through versions, the dependency audit, bundle analysis and duplicate detection. State
this exclusion in the coverage ledger.

### Mandatory coverage artefacts

- `00-coverage.md` — [the coverage ledger](../templates/coverage.md). A file without
  "read in full" means the audit is not finished. This is the only real defense against
  a confident report over a third of the codebase.
- `00-codebase-map.md` — per module: purpose · key files · dependencies · API · entities ·
  external effects · auth requirements · existing tests · risks · **your confidence in
  what the module is for**.

## 5. Six passes per domain

Every domain goes through all six. Not "found a bug, moved on." Full definitions:
[six passes](../METHOD.md#six-passes-per-domain).

- **A — correctness:** every branch, every edge case, races, error handling, and an
  independent recomputation of every domain calculation, including whether the same
  metric agrees across screens.
- **B — backend, data, security:** ownership, validation, idempotency, transactions,
  limits, IDOR, what public surfaces leak, schema constraints and indexes, unbounded
  tables, jobs, migrations, layer drift in both directions.
- **C — performance and cost:** *what it is now (number) → why → what to change →
  expected effect (number) → risk → effort.* Never the bare word "optimize".
- **D — UX flows by persona:** new · active · high-volume · admin · mobile · slow device ·
  slow network. Steps, failure points, missing undo, unconfirmed destructive actions,
  lost input.
- **E — UI states:** the full state matrix per route, mobile widths, accessibility,
  localization, copy and tone.
- **F — tests:** is there a test for the case just found? If not, that is part of the
  finding.

**Ownership tests are mandatory** in both modes, as code or as specification: a user
cannot read, modify or delete another user's record; substituting an id in the URL or the
body does not bypass the check; admin authority is verified on the server, not by hiding
a button; a public link does not expose private fields.

## 6. Domains

```
<domain 1> · <domain 2> · …
```

Each is a vertical slice: database → validation schema → API → client queries → UI →
tests.

## 7. Deliverables

```
README.md                  map: summary tables, systemic themes, top 10, order of work
00-executive-summary.md    for the owner: what was found, what is dangerous, what first
00-discovery.md            §2.1 — the real product model, contradictions, UNCONFIRMED
00-baseline.md             §2.2 — measured results
00-codebase-map.md         §4 — modules, dependencies, risks, confidence
00-coverage.md             §4 — every file × read in full × findings
00-regression.md           §3 — status of every previous finding, with proof
01-<domain>.md …           one file per domain
20-backend-data.md         schema, migrations, indexes, jobs, idempotency, integrity
21-performance.md          §5C — bottlenecks with before/after numbers
22-ux-flows.md             §5D — scenarios × personas
23-ui-states.md            §5E — states, accessibility, localization, copy
24-parity-and-gaps.md      parity map + "backend supports it, UI does not expose it"
25-ideas.md                scored proposals for new functionality
30-security.md
31-infra.md                infrastructure, dependencies, deploy checklist + rollback
32-tests.md                coverage and missing tests by priority
40-proposals.md            list B — proposals, NOT implemented
41-needs-product-decision.md
50-remediation-plan.md     order of work: priority, dependencies, risk, estimate
99-unverified.md           what could not be checked, and why
```

`README.md` must contain: a domain × severity table; **systemic themes** — where twenty
findings share one root cause, which is the main value of the report; the top ten to fix
immediately with blast radius; the top ten ideas by score; the `needs-redesign` list; and
a link to `99-unverified.md`.

## 8. Prohibitions

**8.1 Do not mask errors.** No empty `catch`, blanket `try/catch`, `any`, `@ts-ignore`,
`eslint-disable`, disabled checks, arbitrary timeouts, fabricated data, forced reload, or
suppressed production errors.

**8.2 Do not rewrite working code without a proven reason.** Do not change the API, the
schema or user-visible behaviour without a backward-compatibility analysis. Do not add
functionality for volume.

**8.3 Do not declare unverified work fixed.** A fix counts only when confirmed by a test,
a production build, an API request, browser automation, a SQL check or a reproducible
scenario. Every fixed P0/P1 gets a regression test where possible.

## 9. How to run

**Fan out.** Discovery and baseline run first, once, and go to everyone as shared context.
Each subagent gets this file whole, its group, and the requirement to run all six passes
and fill its slice of the coverage ledger — reading its files **whole**, not by keyword.

```
1.  <core domain group>
2.  <second group>
…
n.  security (cross-cutting)
n+1 infrastructure, dependencies, CI (cross-cutting)
n+2 performance (cross-cutting — takes the other groups' findings as input)
n+3 localization and copy (cross-cutting)
n+4 SYNTHESIZER — dedup, regression reconciliation, systemic themes, README,
    executive summary, remediation plan
```

A single pass is allowed. Then check coverage especially strictly.

## 10. Completion criteria

See [completion criteria](../METHOD.md#completion-criteria). The bar:

> What the owner listed is the **minimum**. The value of the audit is what was found
> beyond it, and in how well hundreds of findings collapse into a comprehensible order
> of work.
