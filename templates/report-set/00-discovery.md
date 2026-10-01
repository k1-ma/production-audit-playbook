# Discovery

> Reconstructed from the code. The repository documentation consists of **claims**, not
> truth — see [two kinds of document](../../METHOD.md#two-kinds-of-document).
>
> Do not conclude a feature exists from a file name. Check that it is imported, reachable
> from the UI, and finished.

## What this product is

By the code, not the marketing.

## Roles

Each one confirmed in code, with where the check actually lives.

## Modules

| Module | State | Reachable from UI | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| | implemented / partial / dead / mentioned-but-absent | yes / no | `path:line` | high / medium / low |

**Dead code is a finding.** So is a module that exists, works, and cannot be reached by any
user — that one is usually also a product finding, because somebody built it.

## Main user journeys

## Entities and relations

## External services

What the product depends on that is not in the repository, and what happens when each one
is unavailable.

## Contradictions between parts of the project

The most valuable section here, and the one nobody writes. Where two parts of the project
disagree, and which is most likely current.

| Contradiction | Source A | Source B | Likely truth | Why |
| --- | --- | --- | --- | --- |

## UNCONFIRMED

Everything that could not be settled from the code. Carried forward into
`99-unverified.md` rather than resolved by assumption.
