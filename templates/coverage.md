# Coverage ledger

> A file without `yes` in "read in full" means the audit is **not finished**.
> Grep is not reading. Fill this in as you go, not at the end.

**Scope declared:** <how the file list was produced — e.g. `git ls-files 'apps/**/*.ts*'`>
**Files in scope:** <n> · **Read in full:** <n> · **Remaining:** <n>

| File | Lines | Read in full | Findings | Note |
| --- | ---: | :---: | ---: | --- |
| `apps/api/src/routes/orders.ts` | 2594 | yes | 7 | ownership check missing on two write paths |
| `apps/web/src/routes/Dashboard.tsx` | 4239 | yes | 4 | |
| `apps/web/src/lib/format.ts` | 88 | yes | 0 | |
| `apps/api/src/jobs/cleanup.ts` | 210 | **no** | — | not reached yet |

## Deliberately excluded

State the exclusions explicitly, with the reason. An unstated exclusion is
indistinguishable from an omission.

| Path | Why excluded | How its risk was covered instead |
| --- | --- | --- |
| `node_modules/**` | third-party | dependency audit, bundle analysis, version review |
| `**/*.generated.ts` | generated | reviewed the generator input instead |

## Largest files

List them separately and read them first. This is where both the bugs and the
opportunities live, and it is exactly where an agent will skim.

| File | Lines | Read in full |
| --- | ---: | :---: |
| | | |
