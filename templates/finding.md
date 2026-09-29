# Finding template

Copy one block per finding. Field definitions and the grading scale live in
[`../FINDINGS.md`](../FINDINGS.md).

```markdown
### [<ID>] [P0|P1|P2|P3|P4|PD] <short title>

- **Domain / screen:**
- **File:** `path/to/file.ts:120-128`

  ```ts
  <the actual lines, quoted>
  ```

- **Class:** bug | calc | security | data-integrity | perf | backend | infra | ux-flow |
  ui-state | a11y | i18n | copy | parity | dead-control | lying-surface | incomplete |
  rule-violation | test-gap | needs-redesign
- **Reproduction:** steps, condition, what data is needed
- **Actual behaviour:**
- **Expected behaviour:** and how that is known — a spec, another module, the schema
- **Impact:** who it affects and how far it reaches
- **Root cause:** the root, not the place it surfaced
- **Fix:** specific, with the files it touches
- **Verification:** which test, query or scenario proves the fix
- **Change risk:** what this could break
- **Status:** FOUND | CONFIRMED | FIXING | FIXED | VERIFIED | BLOCKED |
  NEEDS PRODUCT DECISION | PROPOSAL ONLY
- **Confidence:** high | medium | low
```

---

## Worked example

### [ORD-7] [P0] Order list endpoint filters by workspace but not by user

- **Domain / screen:** Orders → list
- **File:** `apps/api/src/routes/orders.ts:212-219`

  ```ts
  const rows = await db.select().from(orders)
    .where(eq(orders.workspaceId, ctx.workspaceId))
    .orderBy(desc(orders.createdAt));
  ```

- **Class:** security
- **Reproduction:** Two users in the same workspace. Sign in as the second, call
  `GET /api/orders`. The response includes the first user's orders.
- **Actual behaviour:** Every order in the workspace is returned to any member.
- **Expected behaviour:** Scoped to the requesting user. Known from the sibling endpoint
  `orders.ts:288`, which does `and(eq(orders.workspaceId, …), eq(orders.userId, …))`, and
  from the UI, which labels the screen "My orders".
- **Impact:** Every member of a shared workspace reads every other member's orders,
  including amounts and counterparties. All multi-member workspaces are affected.
- **Root cause:** The user predicate was dropped when workspace scoping was introduced;
  the list path was updated, the detail path was not. No ownership test covers the list
  path — only the detail path has one.
- **Fix:** Add `eq(orders.userId, ctx.userId)` to the predicate. Audit the other seven
  `db.select().from(orders)` call sites for the same omission.
- **Verification:** New test: user B calls the list endpoint, asserts user A's order id is
  absent. Extend the existing ownership suite rather than adding a separate file.
- **Change risk:** If any internal caller relied on the list returning the whole
  workspace — the admin export job is the candidate — it breaks. Check before merging.
- **Status:** CONFIRMED
- **Confidence:** high

**Why this example is the shape to copy.** The expected behaviour cites two independent
sources instead of asserting a preference. The root cause names the *class* of mistake,
which is what lets a synthesizer merge it with the other findings from the same cause.
And the change risk names a specific caller to check, not "might break things".
