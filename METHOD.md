# The Method

Everything here exists because a pass failed without it. Read this before the prompts —
they assume it and refer back to it.

---

## Two sentences the whole method hangs on

> **Fix, do not redesign. Prove, do not guess.**

The first keeps an agent inside the job it was given. The second is the difference
between an audit and a plausible essay about your codebase.

"Prove, do not guess" never bends. "Fix, do not redesign" has exactly one exception, and
it is deliberate: when the product's own ceiling is the problem, a parity audit will pass
a surface the owner considers unfinished, and the bar has to become absolute. That case
has its own pass, which revokes the rule explicitly rather than quietly —
[when the ceiling itself is too low](#when-the-ceiling-itself-is-too-low). Everywhere else,
and by default, the rule holds.

---

## Hard constraints

Violating any of these makes the work defective, not merely incomplete. State them in
the prompt; agents follow them far more reliably when they are numbered and framed as
grounds for rejecting the work.

**1. No conclusions from memory.** Every statement is backed by `Read`/`grep` with
`path:line`. For any claim of the form "this works" or "this is broken", the evidence is
a trace, not an inspection:

```
control → handler → query/mutation → API → SQL → response → render
```

A control that is wired to a handler proves nothing. The trace has to reach a visible
effect, or the finding is that it does not.

**2. Existing design is not the subject** — in passes 1 through 4. Proposals are deltas
against the current layout, not replacements for it. Anything that needs a redesign is
tagged `needs-redesign` and handed to the owner without further work. See
[run modes](#run-modes) for the exact boundary, and
[pass 5](prompts/5-absolute-bar.md) for the one case where this constraint is lifted on
purpose.

**3. Project rules are the frame, not the topic.** Whatever architectural rules your
repo has, every proposal must already comply with them. An agent that discovers a
proposal violates a rule rewrites it into an allowed pattern *before* writing it down,
rather than filing it and letting a human catch it.

**4. Committed migrations are immutable.** A migration that has run anywhere is never
edited. Errors in an old migration are fixed by a new idempotent one. This rule gets
broken by agents constantly, because editing the old file is obviously simpler and the
consequence is invisible locally.

**5. Nothing destructive.** No operations on production data, no publishing of secrets
or personal data, no automatic changes to production infrastructure. Dangerous steps are
written up as a deploy plan with a rollback, not executed.

**6. Product decisions are not the agent's.** Ambiguous behaviour gets the status
`NEEDS PRODUCT DECISION` with options and consequences, not a guess dressed as a finding.

### Not masking errors

Forbidden as "fixes": empty `catch`, blanket `try/catch`, `any`, `@ts-ignore`,
`eslint-disable`, disabling a check, arbitrary timeouts, fabricated data, forced reload,
suppressing errors in production. Each of these converts a finding into a silent
failure, which is strictly worse than the bug.

### Not declaring unverified work fixed

A fix counts as done only when confirmed by at least one of: a test, a production build,
an API request, browser automation, a SQL check, or a reproducible scenario. Every fixed
P0/P1 gets a regression test where technically possible.

---

## Run modes

Declared by the owner before the run, and restated by the agent in its first message.

| Mode | What it does | When |
| --- | --- | --- |
| **R — research only** *(default)* | Reads and reports. Not one line of product code. Even a P0 is written up as a finding with a ready patch plan. | You need the full picture before deciding anything |
| **RF — research + safe fix** | The same, plus the agent fixes confirmed defects from **list A** and writes regression tests. Everything in **list B** stays a proposal. | You trust autonomous fixing and have time to review a large PR |

If no mode is named, work in **R**. In **RF**, every fix is a separate commit referencing
a finding ID.

### List A — may be fixed

Confirmed backend and frontend logic bugs · database problems · data loss or corruption ·
ownership and authorization errors · vulnerabilities · incorrect calculations · race
conditions · API and validation errors · memory leaks · cache invalidation · serious
performance bottlenecks · broken user journeys · localization errors · **objective UI
defects**: broken responsiveness, elements off-screen, unreachable buttons, overlaps,
unreadable text, wrong loading/error/empty states, broken dropdowns and modals, z-index,
missing focus states, keyboard navigation, touch targets under 44px, layout shift,
obviously wrong profit/loss colours, raw i18n keys showing as text, janky animation,
accessibility bugs · build/typecheck/lint errors · missing critical tests · logging gaps.

Even these are minimal and stay inside the current visual language.

### List B — propose only, never implement

Page redesign · new dashboard or analytics structure · new navigation · new card or chart
style · changes to visual hierarchy and block placement · merging or splitting pages ·
changes to user flow · removing existing functionality · large new interface blocks ·
brand identity · global spacing/radius/colour/icon changes · terminology changes · changes
to calculation rules · changes to user data structure · new product features · business
logic changes without a confirmed expected behaviour.

The line that matters: **an objective bug, a UX problem, a subjective visual preference
and a product hypothesis are four different things.** A subjective preference is never
called a bug.

---

## Two kinds of document

This is the input-handling rule most audits get wrong, and it is worth more than any
prompt wording.

- **Binding documents** — architecture rules, the stack decisions, the operating
  contract. Cannot be violated. Can be argued with.
- **Verifiable claims** — the README, handover notes, tech-debt lists, previous audits,
  changelog entries, code comments, and **file and entity names**. These are checked
  against the code. **A divergence is itself a finding.**

Do not conclude a feature exists from a file name. Check that it is imported, reachable
from the UI, and finished. Dead code is a finding too.

Anything that cannot be settled from the code is marked `UNCONFIRMED` rather than
resolved by assumption.

---

## Discovery and baseline

Both happen **before** any conclusions, and before fan-out. They are handed to every
subagent as shared context.

**Discovery** reconstructs the actual product from the code: what it does, the user roles,
which modules are really implemented, which are partial, which exist in code but are
unreachable from the UI, which are mentioned but absent, the entities and their relations,
the external services, and — separately — **the contradictions between parts of the
project**, with a judgement about which source is most likely current.

**Baseline** records measurements, not expectations. Install, typecheck, lint, test,
build, dependency audit — each with a real result from the
[status vocabulary](FINDINGS.md#status-vocabulary). Plus versions, bundle size, the
heaviest dependencies, duplicate libraries, the last actual migration versus what the
migration journal claims, and request counts on the main screens.

> Run typecheck and tests **from the repo root**, not per workspace. Monorepo task
> runners pass environment through at the root; a per-workspace run can pass while the
> real pipeline fails, and that false green has cost a pass before.

If something could not be run, the value is `BLOCKED: <reason>`. Never `PASS` for
something that did not execute.

---

## The two ledgers

### Coverage ledger

A table of every file in scope: `file · lines · read in full (yes/no) · findings · note`.

A file without "yes" means the audit is not finished.

This is the single defense against the most common failure of agent-run audits: the agent
visits the files it already has context on, finds real bugs there, produces a confident
report, and leaves two thirds of the codebase untouched — invisibly, because the report
looks complete. Grep is not reading. Large files are where both the bugs and the
opportunities live, and they are exactly the ones an agent will skim.

Template: [`templates/coverage.md`](templates/coverage.md)

### Regression ledger

Every previous finding of high severity gets a current status, proven against the code:
`FIXED` (with commit or `path:line`), `OPEN` (still reproducing, with location),
`PARTIAL` (fixed for X, not for Y).

Three rules make it useful:

- An `OPEN` finding is not re-described. `ID + one line + current path:line`.
- A `FIXED` finding is checked for **what the fix broke**. The recurring case: someone
  corrects a cache invalidation and creates a refetch storm.
- **A `DONE` claim is reconciled against the artifact, not against the diff that claimed
  it.** A diff can honestly show a component replaced while the screen looks identical. If
  a progress table says done and the owner says nothing changed, one of the two is false,
  and establishing which comes *before* scheduling more work — otherwise the work goes
  around the same loop a second time. In the passes this came from, the previous plan's one
  unclosed row was "screenshot QA — cannot be produced from a diff; needs a browser with a
  session and a database". That row was the entire explanation: everything verifiable from
  a diff had been marked done, and the one check that required looking at the rendered
  product had never run.

Template: [`templates/regression.md`](templates/regression.md)

---

## Seed → generalized rule

The most valuable idea here, and the one that changes an audit's yield the most.

A complaint from a user or an owner is **the seed of a pattern, not a checklist item**.
The screen where it was noticed is just where it was noticed first. For each seed, derive
the general rule, then run that rule across the entire product — every screen, every tab,
every control, every form, every empty state, every line of copy.

| Seed (what someone reported) | Generalized rule (run everywhere) |
| --- | --- |
| The theme switcher changes nothing | **Every** settings control, toggle, swatch, select → trace to a visible effect. Anything that changes neither DOM nor server nor visible state is a **dead control**. |
| Dashboard shows 0 with 10 records entered | **Every** counter, list, KPI and chart on **any** screen → reconcile against its data source. Any "0 / empty / wrong while data exists" is a **lying surface**. Pay special attention to hidden default filters: date ranges, account scope, status. |
| A technical message leaked into the UI | **Every** string, in i18n files and inline in markup → hunt for job names, cron schedules, UTC, route paths, SQL phrasing, internal ids, debug tone. That is a **leaked internal**; rewrite in product voice. |
| This widget doesn't look real | **Every** visual widget, illustration, diagram and empty state → judge fidelity. Decorative fake instead of a real representation of the data is **low fidelity**. |
| Adding a record here is thin compared to over there | **Every** add/create/edit flow → compare against the richest equivalent in the product *and against what the backend already accepts*. Missing fields are a **shallow feature**. Keep a separate list of "backend supports it, UI does not expose it" — that is free functionality. |
| Only preset options, can't enter my own | **Every** selection list → can the user enter their own value, or is it a hardcoded prison? |
| Two different jobs compete for one scroll | **Every** long screen → judge layout and navigation. Missing tabs or sections is a **ux-flow** finding. |

**The completion criterion follows from this.** A screen is marked done when *all* rules
have been run against it — not when the reported problem was confirmed. The user's
examples are the floor. If the audit found only what was pointed at, it failed.

---

## Deriving the reference

When the question is quality rather than correctness, an audit needs a ruler, or it
degenerates into "I don't like it". Do not supply the ruler yourself. **Derive it from the
product's own best pages.**

1. Rank pages by recency and density of work — `git log --since` over the client source is
   enough to start. Intersect with where the richer shared components are used, where
   skeleton/empty/error states already exist, and where tests exist.
2. Pick two to four reference pages and record **why those**, citing code.
3. Extract the design system *from* them as **actual values** — tokens really in use, the
   type scale, grid and density, radii and shadows, the full set of control and screen
   states, motion durations and easing, the accessibility floor. Not principles.
4. Turn that into a 30–50 point parity checklist where **every item cites a reference
   `path:line` as its exemplar**.
5. Do the same for capability: write out the full feature set of the richest entity in the
   product. That is the product's own maximum, and every other entity is measured against it.

> **The rule that makes this honest: an item you cannot confirm from the reference's own
> code does not go into the checklist.** That is the entire defense against importing taste
> from outside and presenting it as an audit finding.

The reference is then **not improved in this pass**. It is the ruler, not the object of
work. Wanting to change the ruler is a separate finding for the owner.

**Show the reference to the owner before continuing.** If it is wrong, every later step is
wasted — and that is cheap to discover at step 2 and expensive at step 40.

### When the ceiling itself is too low

A neglected surface can *pass* a parity audit — it is no worse than the best page — while
the owner looks at it and says it is not good enough. That is a real outcome, not a
contradiction, and it means the bar has to become absolute for those surfaces: not "worse
than our best page" but **"would someone paying for this consider this finished"**. Two
things change with it. Internal parity stops being a defense — *"it's like this everywhere"*
is an argument against the product, not for the block. And the unit of work drops from the
page to **the block**, because pages hide their bad blocks behind their good ones.

See [`prompts/5-absolute-bar.md`](prompts/5-absolute-bar.md), which revokes the parity rule
on purpose.

## Six passes per domain

Every domain goes through all six. Not "found a bug, moved on."

**A — Correctness.** Trace the happy path and *every* branch: empty list, single item,
deleted item, someone else's item, partial states, zero and negative values, future
dates, timezone changes, DST, leap day, very large numbers, very long names. Races:
parallel submit, double click, refetch over an edit, requests after unmount, stale
closures. Error handling: empty catches, swallowed rejections, success toasts fired
before the mutation resolves, state after an error. **Recompute every domain calculation
independently**, and check whether the same metric agrees across different screens.

**B — Backend, data, security.** On every write endpoint: ownership, validation,
idempotency, transactions, soft delete, limits, rate limiting, mass assignment, audit
logging. IDOR, enumeration, replay. Correct 404 vs 403 vs 200. What public surfaces
actually leak. Schema: foreign keys, cascade behaviour, constraints, defaults, timezone
handling, decimal precision, indexes matching the actual queries, unbounded table growth
without a paired cleanup job. Jobs: idempotency, retries, behaviour on failure,
concurrency across replicas. Layer drift in both directions — including **"backend
supports it, the UI never exposes it"**.

**C — Performance and cost.** Measure, do not assume. Each item:
*what it is now (a number) → why → what to change → expected effect (a number) → risk →
effort.* Never ship the word "optimize" without a number or a plan to get one.
**Do not degrade the appearance for a marginal gain.**

**D — UX flows by persona.** New user · active user · user with a lot of data · admin ·
mobile · slow device · slow network. Per scenario: number of steps and clicks, failure
points, where there is no undo, where a destructive action has no confirmation, where the
user cannot tell whether it worked, where entered data is lost.

**E — UI states.** For every route and major block: `normal · loading · empty · error ·
partial · offline · slow network · 401 · 403 · 404 · 429 · 500 · very large data sets ·
long names · big and negative numbers · refresh · back/forward · repeat submit · rapid
toggling · stale state · expired session · deleted entity · mobile layout`. Missing any of
the first five is a finding — especially "empty screen looks identical to a new user's,
but it is actually a network error". Plus mobile widths, touch targets, focus traps,
tab order, contrast, meaning conveyed by colour alone, reduced motion, missing
translations, hardcoded strings.

**F — Tests.** Is there a test for the case just found? If not, that gap is part of the
finding.

---

## Fan-out and synthesis

A single agent over a large codebase produces coverage theatre. Fan out.

- Discovery and baseline run **first**, once, and are given to everyone.
- One subagent per domain or domain group. Each gets the full method, its own group, and
  the requirement to run all six passes and fill in its slice of the coverage ledger.
- Cross-cutting subagents for security, infrastructure, performance and i18n — the
  performance one takes the other groups' findings as input.
- A **synthesizer** deduplicates, reconciles against the regression ledger, finds the
  systemic themes, and writes the summary and the remediation order.

### Synthesis

The synthesizer's job is not to concatenate. It is to find where **twenty findings share
one root cause**. Those systemic themes are the main value of the report — they turn a
list into an order of work. The summary leads with them, then the top ten by blast radius,
then everything else.

A flat list of four hundred issues is raw material, not a result.

---

## Instrument errors stay in the record

When you build measurement tools for an audit — screenshot harnesses, contrast checkers,
DOM probes — **the tools will be wrong at least once**, and their wrong numbers will end
up in a report.

Keep the broken tool and the correction in the repository, documented. Two reasons. The
practical one: someone will otherwise rebuild the same broken instrument and rediscover
the same wrong numbers. The one that matters more: a report that records where its own
instruments lied is the only kind a reader has grounds to trust.

A real example from the passes this came from: a contrast checker read
`getComputedStyle().color`, which returns **both** `rgb(231, 236, 247)` on a 0–255 scale
and `color(srgb 0.918745 0.788157 0.535686)` on a 0–1 scale, depending on how the value
was authored. The parser handled only the first. Every colour defined in the second form
was measured as almost black, and produced a page of confident, entirely wrong contrast
failures.

---

## Agent anti-patterns

State these in the prompt as grounds for rejecting the work. Every one of them happened in
a real pass, and most of them produce a report that looks *better* than an honest one,
which is why they need naming rather than hoping.

- **A silent coverage limit.** Looked at 12 of 34 screens? Write that in the report header.
  An unstated sample reads as full coverage — the most expensive lie an audit can tell, and
  the reason the [coverage ledger](#coverage-ledger) exists.
- **A count instead of an analysis.** "Found 47 hardcoded values" with no examination of
  each. Some are legitimate, and saying which ones is the job.
- **A finding with no `path:line`** or, for anything visual, no visual proof.
- **Concluding from the code what only production can answer.** "The feed works" from
  reading the fetch call, without looking at what the endpoint actually returns right now.
- **Judging an empty screen as a design.** Seed the data first, then look.
- **A `TODO` filed as a defect** with no statement of what the user experiences.
- **Mixing two kinds of problem in one finding.** A correctness bug, a UX problem, a
  subjective visual preference and a product hypothesis are four different things with four
  different owners. Mixed together they are unschedulable.
- **A subjective preference presented as a defect.**
- **"Let me rewrite it in `<library>`."** A delta to what exists, or a replacement for one
  block — never a replacement for the stack.
- **Deciding a product question** on the owner's behalf instead of filing
  `NEEDS PRODUCT DECISION`.
- **A diagnosis with no replacement**, in a pass whose output is supposed to be a plan.
- **Marking visual work done without seeing it in the dark theme**, where a token used in
  the wrong role can read 1.17:1 and the light theme shows nothing wrong.

## Completion criteria

The work is finished only when all of these hold at once:

1. The actual product context is reconstructed, assumptions are separated from facts
   (`UNCONFIRMED` where applicable), documentation contradictions are recorded.
2. The baseline contains real command results, not expectations.
3. The coverage ledger contains no file marked "not read in full".
4. Every domain is marked "all six passes run".
5. The regression ledger has a proven status for **every** previous high-severity finding.
6. Ownership and data integrity are verified on the key endpoints.
7. Every domain calculation has been recomputed, and disagreements between screens are
   recorded.
8. The main scenarios have been walked on desktop and mobile, for every persona.
9. Performance findings are **measurable** — a number, or a plan to get one.
10. In RF mode: confirmed P0/P1 are fixed, each with a regression test, production build
    verified. In R mode: every P0/P1 has a ready patch plan.
11. The UI has not been subjectively reworked; redesigns and new features exist only as
    proposals.
12. Everything that could not be verified is listed, with the reason.

> The bar: what the owner listed is the **minimum**. The value of an audit is what it
> found beyond that, and in how well hundreds of findings collapse into a comprehensible
> order of work.
