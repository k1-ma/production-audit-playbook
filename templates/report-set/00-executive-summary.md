# Executive summary

> Two pages. Written for the person deciding what to spend the next week on, who will not
> open the other twenty files. Answer four questions and stop.

**Pass:** `<which>` · **Mode:** `R` / `RF` · **Commit:** `<sha>` · **Date:** `<date>`

## Coverage, stated plainly

`<n>` of `<n>` files read in full. `<n>` domains, all passes run on `<n>` of them.
Not reached: `<what>`. Full accounting in `00-coverage.md`; gaps in `99-unverified.md`.

> State the limit in the first paragraph, not the last. An unstated sample reads as full
> coverage, and that is the most expensive thing an audit can get wrong — every decision
> downstream assumes it.

## What is dangerous

The P0s in plain language, with blast radius. Not the full list — the ones that change what
happens this week.

| ID | What happens | Who it affects | Fix effort |
| --- | --- | --- | --- |

## Where we are lying to the user

Numbers, labels and images on screen that are not true, by
[class](../../FINDINGS.md#data-truthfulness). On a public surface this outranks most bugs:
it is the category that costs trust rather than function, and it is invisible to every test
in the repository.

| ID | What the user sees | What they believe | Class | Cost of the error |
| --- | --- | --- | --- | --- |

## What to fix first, and what it costs

From `06-plan.md`, wave 1. Systemic themes before individual findings.

| Order | What | Closes | Effort |
| ---: | --- | ---: | --- |

## Counts

| | P0 | P1 | P2 | P3 | P4 | PD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Found | | | | | | |
| Fixed and verified (RF only) | | | | | | |

## What was deliberately not changed, and why

Including everything that is a proposal rather than a fix, and everything waiting on a
product decision. A reader should finish this section knowing what the audit chose not to
touch — not wondering whether it was missed.
