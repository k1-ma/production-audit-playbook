# The deliverable set

One directory per pass. The point of a fixed set is that a reader knows where to look
before they open anything, and that the awkward files — coverage, regression, unverified —
exist by default instead of being omitted when they turn out inconvenient.

| File | What it must contain |
| --- | --- |
| `README.md` | The map: domain × severity table, **systemic themes first**, top 10 by blast radius, the `needs-redesign` list, a link to `99-unverified.md` |
| `00-executive-summary.md` | Two pages for the owner. What was found, what is dangerous, what to do first |
| `00-discovery.md` | The real product model, reconstructed from code. Contradictions between parts of the project, as their own list. Everything `UNCONFIRMED` |
| `00-baseline.md` | Measured results of install / typecheck / lint / test / build / dependency audit, plus versions and sizes |
| `00-codebase-map.md` | Per module: purpose · key files · dependencies · API · entities · external effects · auth · tests · risks · **your confidence in what it is for** |
| `00-coverage.md` | [The coverage ledger](../coverage.md). A file without "read in full" means the audit is not finished |
| `00-regression.md` | [The regression ledger](../regression.md). Every previous finding, with proof |
| `01-<domain>.md` … | One file per domain |
| `05-systemic.md` | Where many findings share one cause |
| `06-plan.md` | Order of work: priority, dependencies, risk, estimate |
| `20-backend-data.md` | Schema, migrations, indexes, jobs, idempotency, integrity |
| `21-performance.md` | Bottlenecks with before/after numbers |
| `22-ux-flows.md` | Scenarios × personas |
| `23-ui-states.md` | State matrix, accessibility, localization, copy |
| `24-parity-and-gaps.md` | The parity map, plus "backend supports it, the UI does not expose it" |
| `25-ideas.md` | Scored proposals for new functionality |
| `30-security.md` | |
| `31-infra.md` | Infrastructure, dependencies, deploy checklist, rollback |
| `32-tests.md` | Coverage and missing tests by priority |
| `40-proposals.md` | List B — proposals, **not implemented** |
| `41-needs-product-decision.md` | Everything blocked on a product choice: options and consequences |
| `99-unverified.md` | What could not be checked, and why |

Three of these get dropped under time pressure, and they are the three that make the rest
trustworthy: `00-coverage.md`, `00-regression.md`, `99-unverified.md`. A report set missing
them is a set of opinions.
