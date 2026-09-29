# Findings

How a finding is written, graded and tracked. The format is deliberately heavy: the
fields that feel like bureaucracy are the ones that stop an agent from filing a guess.

---

## Status vocabulary

Any result of running something — a command, a check, a verification — is reported using
exactly one of these words. There is no wording available for "probably fine".

| Status | Meaning |
| --- | --- |
| `PASS` | Ran, succeeded |
| `FAIL` | Ran, failed |
| `PARTIAL` | Ran, succeeded for part of the scope — the note says which part |
| `BLOCKED` | Could not run, with the reason (`BLOCKED: no database`) |
| `NOT AVAILABLE` | The check does not exist for this project |
| `NOT RUN` | Simply was not run |

**Never write `PASS` for something that was not executed.** This single rule catches more
fabrication than any instruction about honesty, because it removes the vocabulary that
makes fabrication comfortable. An agent that cannot write "looks correct" has to write
`NOT RUN`, and `NOT RUN` in a report is visible.

---

## Severity

| Level | Meaning |
| --- | --- |
| `P0` | Data loss, access to another user's data, critical vulnerability, total failure |
| `P1` | Serious bug in a key journey |
| `P2` | Noticeable defect — performance, UX |
| `P3` | Tech debt, quality |
| `P4` | Optional idea |
| `PD` | Needs a product decision |

Grade by **blast radius and reversibility**, not by how annoying it is to fix.

---

## Finding status

`FOUND` → `CONFIRMED` → `FIXING` → `FIXED` → `VERIFIED`, plus the terminal states
`BLOCKED`, `NEEDS PRODUCT DECISION`, `PROPOSAL ONLY`.

`FIXED` and `VERIFIED` are different on purpose. `FIXED` means the change is written.
`VERIFIED` means it was proven by a test, a build, a request, browser automation, a SQL
check or a reproducible scenario. Only `VERIFIED` closes anything.

---

## Classes

`bug` · `calc` · `security` · `data-integrity` · `perf` · `backend` · `infra` ·
`ux-flow` · `ui-state` · `a11y` · `i18n` · `copy` · `parity` · `dead-control` ·
`lying-surface` · `incomplete` · `rule-violation` · `test-gap` · `needs-redesign`

Four of these are the taxonomy that the product-feel pass contributed, and they are worth
defining precisely because ordinary bug reports have no word for them:

- **`dead-control`** — the element renders but affects nothing. Either it never applies to
  the DOM or the server, or it applies and no consumer reads it.
- **`lying-surface`** — the screen shows 0, empty or wrong while the data exists. Usually
  a hidden default filter: a date range, an account scope, a status condition.
- **`leaked-internal`** — the user can see job names, cron schedules, UTC, internal ids,
  route paths, SQL phrasing, debug tone.
- **`shallow-feature`** — the feature exists but its depth is poor relative to the
  equivalent elsewhere in the product, or relative to what the backend already accepts.

And one that ordinary reports miss entirely:

- **`parity`** — the same operation, implemented fully in one module and stunted in
  another. This is not a bug in either module. It is only visible when you compare them,
  which is why nobody files it, and why it accumulates.

---

## ID scheme

A short domain prefix plus a number: `T-4`, `SEC-2`, `PERF-11`. Assign prefixes to your
own domains. Reserve these cross-cutting ones, which are the same in every project:

`SEC-` security · `PERF-` performance · `INF-` infrastructure · `API-` backend, jobs,
schema · `I18-` localization · `UI-` shared UI · `PROP-` a UX/UI proposal ·
`IDEA-` proposed new functionality.

IDs matter more than they look. They are how the regression ledger of the *next* pass
refers to this one without re-describing anything, and how a fix commit points at the
reason it exists.

---

## The finding template

```markdown
### [<ID>] [P0|P1|P2|P3|P4|PD] <short title>

- **Domain / screen:**
- **File:** `path/to/file.ts:120-128` (+ the quoted lines)
- **Class:**
- **Reproduction:** steps, condition, what data is needed
- **Actual behaviour:**
- **Expected behaviour:** and how that is known — a spec, another module, the schema
- **Impact:** who it affects and how far it reaches
- **Root cause:** the root, not the place it surfaced
- **Fix:** specific, with the files it touches
- **Verification:** which test, query or scenario proves the fix
- **Change risk:** what this could break
- **Status:**
- **Confidence:** high | medium | low
```

Three fields do most of the work:

**Expected behaviour — and how that is known.** Without the second half, an agent
substitutes its own taste for a specification, and a subjective preference enters the
report as a defect.

**Root cause, not the place it surfaced.** This is what makes synthesis possible later.
Twenty findings that name the same root cause collapse into one systemic theme; twenty
findings that name twenty file locations stay twenty tickets.

**Confidence.** An agent allowed to say `low` will file the uncertain finding instead of
either inflating it or dropping it. Both of those are worse.

---

## Proposals are a different shape

Anything from [list B](METHOD.md#list-b--propose-only-never-implement) is not a finding
and does not get a severity. It gets this:

```markdown
### [PROP-<n>] <title>

Page · Problem · User scenario · Evidence (`path:line`) · Proposed change ·
Why it is better · **What is kept from the current design** · What changes ·
Impact on existing users · Risks · Complexity · Priority · Text wireframe
```

The field that keeps this honest is **what is kept**. A proposal that cannot name what it
preserves is a redesign wearing a smaller hat.

---

## New functionality is a third shape

```markdown
### [IDEA-<n>] <title>

- **Problem it solves** and for whom
- **Which existing data it builds on:** tables and fields; what would need adding
- **What is proposed:** down to fields and screens
- **MVP / extended:** two steps
- **Where it fits:** which existing screens it touches, and **which pages need no change**
- **Backend / DB / privacy:** endpoints, migrations, privacy implications
- **Cost and risk:** S/M/L, and specifically what has to be built
- **How to test the hypothesis:** a metric, an experiment, a question for users
- **The case against:** an honest counterargument
- **Scoring 1-10:** user value · product fit · differentiation · retention · cost · risk
```

Filter before writing: an idea with no grounding in existing data and no clear step in a
user loop does not get written down. Fifteen grounded ideas beat sixty generic ones.
