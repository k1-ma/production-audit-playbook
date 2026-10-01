# Baseline

> Measured, not expected. Every value comes from the
> [status vocabulary](../../FINDINGS.md#status-vocabulary): `PASS` · `FAIL` · `PARTIAL` ·
> `BLOCKED: <reason>` · `NOT AVAILABLE` · `NOT RUN`.
>
> **Never `PASS` for something that did not execute.**
>
> Run typecheck and tests **from the repo root**. A per-workspace run can pass while the
> real pipeline fails, because monorepo task runners pass environment through at the root.
> That false green has cost a pass before.

**Commit:** `<sha>` · **Date:** `<date>` · **Environment:** `<os / runtime / package manager>`

| Command | Status | Time | Notes |
| --- | --- | ---: | --- |
| `<install>` | | | warnings, lockfile changes |
| `<typecheck>` | | | error count per package |
| `<lint>` | | | |
| `<test>` | | | passed / failed / skipped |
| `<build>` | | | chunk sizes |
| `<dependency audit>` | | | by severity |

## The stack as it actually is

Runtime · package manager · ORM · migration system · auth · external services · file
storage and CDN · deployment · CI workflows · logging · monitoring.

Record what the code uses, not what the documentation says it uses. A divergence here is a
finding, and it is a common one.

## Drift found while measuring

| Claim | Reality | Where the claim lives |
| --- | --- | --- |
| last migration is `<n>` | actual is `<n>` | the migration journal |

## Size

Bundle total and per chunk · the ten heaviest dependencies · duplicate libraries · unused
and outdated packages · number of requests on first paint of the main screens.

These numbers are the `before` column of every performance finding in this pass. Without
them, pass C produces the word "optimize".
