# Unverified

> What could not be checked, and why.
>
> This file existing is what makes the rest of the set trustworthy: a reader can tell the
> difference between "checked and fine" and "never reached". Omitting it does not make the
> audit look more complete to anyone who knows to look for it.

| Area | Why not verified | What it would take | Risk of leaving it |
| --- | --- | --- | --- |
| `<area>` | `BLOCKED: no production database access` | a read replica, or a seeded copy | `<what could be hiding here>` |

## Claims carried forward as UNCONFIRMED

From `00-discovery.md` — statements that could not be settled from the code.

| Claim | Where it came from | How to settle it |
| --- | --- | --- |

## Checks that were not run

| Check | Status | Why |
| --- | --- | --- |
| `<check>` | `NOT RUN` / `BLOCKED` / `NOT AVAILABLE` | |

## Instrument limits

Where a measurement tool could not answer, as opposed to answering "fine". See
[instrument errors](../../tools/README.md#instrument-errors) — a tool that quietly guesses
on the cases it cannot handle is worse than one that names them, and those named cases
belong here.
