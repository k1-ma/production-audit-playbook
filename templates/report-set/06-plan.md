# Remediation plan

> An order of work, not a list of problems. Built from `05-systemic.md` first, then the
> individual findings that survive it.

## Wave 1 — <what this wave achieves on its own>

Shippable alone, visibly changes something, needs no new data and no schema change.

| # | Finding / theme | What to do | Files | Effort | Risk | Verified by |
| ---: | --- | --- | --- | --- | --- | --- |

## Wave 2 — needs a shared piece built first

List the shared components and endpoints the later work implies. If six findings all need
the same empty state, building it once is **one** task that belongs before all six — not six
tasks that each rebuild it.

| Shared piece | Which findings need it |
| --- | --- |

## Wave 3 — needs data that is not collected, or a product decision

| Finding | Blocked on | Who decides |
| --- | --- | --- |

## Dependencies

What must land before what, and why. Where two items touch the same file, say so — that is
a merge conflict scheduled in advance.

## Explicitly not planned

Findings deliberately left alone, with the reason. An audit that plans everything it found
has not prioritized; it has only sorted.
