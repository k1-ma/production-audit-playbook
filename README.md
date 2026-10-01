# Production Audit Playbook

A method for auditing a large, live codebase with coding agents — and for making the
result trustworthy enough to act on.

Not a prompt collection. The prompts are the smallest part. The method is the part that
survives contact with a real repository: how you stop an agent from reporting what it
guessed, how you prove it actually read the code, how you turn one bug report into a
sweep across the whole product, and how you fold four hundred findings into a short
list somebody can start work on Monday.

---

## Where it comes from

This is extracted from five full audit passes over a single production SaaS codebase —
roughly 117k lines of TypeScript, 490 test files, 170 database migrations, a live
product with paying users. The passes ran over five months. Each one was written after
the previous one failed in a specific, instructive way.

The failures shaped every rule here:

| Pass | What it was for | What went wrong, and became a rule |
| --- | --- | --- |
| 1 | Correctness: bugs, security holes, layer drift | Agents reported plausible findings they had not verified → **every claim carries `path:line`** |
| 2 | Product feel: dead controls, screens that lie | Agents confirmed the complaints and stopped → **seed → generalized rule** |
| 3 | Total line-by-line sweep | Agents skimmed familiar files and declared coverage → **the coverage ledger** |
| 4 | Parity against the product's own ceiling | Measurement tools were themselves wrong → **instrument errors stay in the record** |
| 5 | Redesign, where the ceiling was the problem | A progress table said `DONE` while nothing had changed on screen → **reconcile claims against the artifact, not the diff** |

Nothing here is theoretical. Every rule exists because its absence cost a pass.

---

## The six ideas worth stealing

**1. Seed → generalized rule.** A user complaint is not a checklist item. It is the seed
of a pattern. "The theme switcher does nothing" becomes *trace every settings control to
a visible effect; anything that changes neither DOM nor server is a dead control* — and
then you run that rule across every screen, including the ones nobody complained about.
An audit is finished when every screen has been run through every rule, not when the
reported bugs are confirmed. → [`METHOD.md`](METHOD.md#seed--generalized-rule)

**2. The coverage ledger.** One table: file · lines · read in full (yes/no) · findings.
A file without "yes" means the audit is not finished. This is the only real defense
against an agent that visited the places it already knew and called it a sweep.
→ [`templates/coverage.md`](templates/coverage.md)

**3. A status vocabulary that cannot lie.** Results are reported only as
`PASS / FAIL / PARTIAL / BLOCKED / NOT AVAILABLE / NOT RUN`. There is no wording for
"probably fine". If a command was never executed, the only honest value is `NOT RUN`,
and the report says so. → [`FINDINGS.md`](FINDINGS.md#status-vocabulary)

**4. Binding documents vs verifiable claims.** Your architecture rules are binding. Your
README, your past audits, your file names and your code comments are *claims* — they get
checked against the code, and a divergence is itself a finding. Most audit tools treat
project documentation as ground truth. It is the least reliable input you have.
→ [`METHOD.md`](METHOD.md#two-kinds-of-document)

**5. Systemic themes.** Twenty findings that share one root cause are worth more than
twenty findings. The synthesis step exists to find those, and the summary leads with
them. A flat list of four hundred issues is not an audit result; it is raw material.
→ [`METHOD.md`](METHOD.md#synthesis)

**6. Is the number on screen true?** A separate axis from "does it work", with its own
five-class grading: an honest placeholder, a fallback that looks like live data, something
that was true once, something invented, and the same figure disagreeing with itself in two
places. Nothing else in a normal review process asks this, and on a public surface an
invented number is a P0. → [`FINDINGS.md`](FINDINGS.md#data-truthfulness)

---

## What is in here

```
METHOD.md               the method: principles, run modes, the two ledgers,
                        seed → rule, deriving the reference, six passes,
                        fan-out, agent anti-patterns, completion criteria
FINDINGS.md             finding format, severity, status vocabulary, data
                        truthfulness classes, tiers, scoring, ID scheme
prompts/
  1-correctness.md      bugs, security, layer drift, feature parity
  2-product-feel.md     dead controls, lying surfaces, leaked internals, shallow features
  3-full-sweep.md       line-by-line coverage: discovery, baseline, six passes per domain
  4-internal-parity.md  design · capability · data truthfulness, measured against the
                        product's own best pages
  5-absolute-bar.md     block-level redesign, for when the product's own ceiling is
                        the problem
templates/
  coverage.md           the coverage ledger
  regression.md         status of every previous finding, with proof
  finding.md            one finding, with a worked example
  report-set/           the deliverable skeleton
tools/
  shot.mjs              full-page capture with click chains, console errors and
                        failing requests recorded per shot
  contrast.mjs          contrast over the composited translucent background stack
  README.md             capture rules, and the instrument errors kept on purpose
```

### Which pass

| You want to know | Pass |
| --- | --- |
| What is broken, unsafe, or out of sync between layers | [1](prompts/1-correctness.md) |
| Why the product feels unfinished | [2](prompts/2-product-feel.md) |
| Everything, with proven coverage and measured baselines | [3](prompts/3-full-sweep.md) |
| Which screens lag behind our own best ones, and whether the numbers are true | [4](prompts/4-internal-parity.md) |
| What to do when our best is not good enough | [5](prompts/5-absolute-bar.md) |

Passes 1–3 and 4–5 answer different questions. Running a correctness prompt at a quality
problem produces a tidy report about the wrong thing.

## How to use it

1. Read [`METHOD.md`](METHOD.md). The prompts assume it.
2. Pick the pass that matches what you actually need. They are different jobs — running
   the correctness prompt when your problem is "the product feels unfinished" produces a
   tidy report about the wrong thing.
3. Decide the run mode before starting, and say it out loud in the prompt: research-only,
   or research plus safe fixes. An agent that has not been told will choose for you.
4. Fill the domain list in the prompt with your own modules. The prompts ship with the
   shape, not with someone else's product.
5. Fan out one agent per domain, then run a synthesizer over the results. A single agent
   over a large codebase produces coverage theatre.

## Scope and honesty

This method was built for one codebase by one engineer. It has not been validated across
many teams, and some of it is shaped by the specific stack it grew in — a TypeScript
monorepo with a typed API layer, a schema package and a migration history. The parts that
generalize are the principles and the ledgers. The parts that need adapting are the domain
lists and the layer-tracing steps.

It is also not a security audit in the compliance sense, and does not replace one.

## License

MIT — see [`LICENSE`](LICENSE). Use it, fork it, sell audits with it.
