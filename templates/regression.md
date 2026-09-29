# Regression ledger

> Every previous high-severity finding gets a current status, proven against the code.
> Two rules keep this useful:
>
> - An `OPEN` finding is **not re-described**. ID + one line + current `path:line`.
> - A `FIXED` finding is checked for **what the fix broke**. The recurring case: someone
>   corrects a cache invalidation and creates a refetch storm.

**Sources reconciled:** <which previous reports, with dates>
**Previous findings tracked:** <n> · FIXED <n> · OPEN <n> · PARTIAL <n>

| ID | Source | Status | Evidence |
| --- | --- | --- | --- |
| `C1` | `02-dashboard.md` | FIXED in `a1b2c3d` | `metrics.ts:44` now filters by account scope |
| `H1` | `01-orders.md` | OPEN — still reproduces | `orders.ts:212` |
| `#2` | `06-reports.md` | PARTIAL — fixed for CSV, not for PDF | `export.ts:96` |

## Fixes that introduced something new

| Original ID | What the fix did | What it caused | New finding |
| --- | --- | --- | --- |
| | | | |

## Deliberate decisions — not findings

Architectural choices that look like defects and get re-reported every pass. List them
once so the next pass does not spend a day rediscovering them.

| Decision | Why it looks like a bug | Why it is intentional |
| --- | --- | --- |
| | | |
