# Pass 5 — Absolute bar: block-level redesign

> **Use this when the internal ceiling is the problem.**
>
> [Pass 4](4-internal-parity.md) measures the product against its own best pages, and
> forbids both importing taste from outside and redesigning anything. By that rule a
> neglected surface can *pass* — it is no worse than the best page — while the owner looks
> at it and says it is not good enough.
>
> **This pass deliberately revokes that rule** for the surfaces named below. The bar
> becomes absolute. Redesign stops being an escape hatch and becomes the expected output.
> And the unit of work stops being the page.
>
> Principle: **Break it into blocks. Prove the block is bad. Draw the replacement. Score it.**
>
> Read [`../METHOD.md`](../METHOD.md) first. Fill in every `<…>`. Delete this quote block.

---

## 0. Before the first line of work — reconcile the last plan with reality

Skip this and the work goes around the same loop a second time.

If a redesign has been attempted before, there is a plan with a progress table, and that
table probably says most things are `DONE`. If the owner is still unhappy, **one of those
two statements is false, and finding out which one is a precondition, not a formality.**

```
<list the existing plans: path · status · what each actually delivered>
```

The two possibilities, and both have happened:

- The work was done and the plan's definition of "done" was too weak — typically it counted
  *rearranging* as redesign. Then the fix is §2.3, not more work.
- The table is optimistic. Then you need to know which rows, before scheduling anything.

**Reconcile each `DONE` row against the artifact itself**, not against the diff that claimed
it. A diff can honestly show a component replaced while the screen looks identical.

> A worked example from the pass this came from. The previous plan's single unclosed row
> read: *"Screenshot QA, N themes × 2 densities — cannot be produced from a diff; needs a
> browser with a session and a database."* That row was the whole explanation. Everything
> verifiable from a diff had been marked done; the one check that required actually looking
> at the rendered product had never run — and that was exactly where the gap lived. The
> harness in [`../tools/`](../tools/README.md) closes that class of check, which is why it
> is the first thing this pass runs.

## 1. Run mode

`A` audit + design (default): block breakdown, evidence, mockups, plan — no product code.
`AF` adds executing wave 1 as separate commits with verification.

## 2. Hard constraints

**2.1 The bar is absolute.** The question is not "is this block worse than our best page".
The question is **"would someone paying for this consider this block finished"**. Internal
parity is no longer a defense: *"it's like this everywhere in the product"* is not an
argument for a block, it is an argument against the product.

**2.2 The unit of work is the block, not the page.** "The page looks fine" is not a
conclusion. The conclusion is a table of that page's blocks with a verdict on each. Pages
hide their bad blocks behind their good ones; that is why a page-level pass keeps missing
them.

**2.3 Rearranging is not a redesign.** This is the criterion the previous attempt failed —
new blocks added, old ones moved around, nothing redesigned. Define it explicitly and reject
your own proposals against it before writing them down:

```
A redesign changes <what the block shows / how the information is structured /
what the user can do without leaving it>.
It is NOT: new position, new padding, a wrapper card, a changed heading,
the same table with a different border.
```

**2.4 Every "this is bad" verdict carries proof.** A screenshot of the block, plus
`path:line`, plus a statement of **what is wrong here for a person** — not "looks dated".

**2.5 Every "this is bad" carries a drawn replacement.** In words and a layout sketch, naming
**what data it shows and where that data comes from**. A diagnosis without a replacement is
rejected work. This is the rule that stops the pass from producing a list of complaints.

**2.6 Dark themes and both densities are not "later".** A block not checked in the dark
theme and the compact density counts as **unchecked**. The reason is measured, not
theoretical: a navy token used as ink reads 1.17:1 against its own surface, and on the light
theme you cannot see that at all.

**2.7 No product decisions.** "Should this section exist" is `needs-product-decision` with
options and consequences.

**2.8 Nothing destructive, and no real people in mockups.** Production is read-only. No
secrets or personal data in the reports. Do not use real users' names or handles in a
mockup — a mockup gets shared.

## 3. Subject — named explicitly, no "and so on"

List every surface, with its real size. "The admin panel and so on" is not a scope; it is
how a pass quietly covers a third of the work.

| Surface | Sections | Screens | Files | Lines |
| --- | ---: | ---: | ---: | ---: |
| `<surface>` | | | | |

## 4. The block breakdown

For each page in scope, enumerate its blocks before judging any of them. A block is
anything a user would point at: a header, a filter bar, a table, a card, a stat row, an
empty state, a modal, a footer.

| Block | What it is for | Data source | Verdict | Why |
| --- | --- | --- | --- | --- |
| | | | keep / rework / replace | |

`keep` is a legitimate verdict and must be used where it applies — a pass that marks
everything as broken is as useless as one that marks nothing.

## 5. Per block, if the verdict is not `keep`

```markdown
### [<SURFACE>-<n>] <block name>
Page: <route> · Block: <where on the page> · Seen by: <role>
Evidence: <screenshot path> + `path:line`
What is wrong for a person: <not "dated" — what it costs them>
Checked in: <themes> × <densities>        Contrast measured: <value>
Replacement:
  <words + layout sketch>
  Shows: <which data>        From: <endpoint / table>
  What the user can now do without leaving the block:
Is this a redesign, per §2.3: <yes, because …>
Effort: S/M/L        Impact: 1-5        Priority: P0-P3
Status: ready | needs-product-decision | needs-data (the source does not exist yet)
```

`needs-data` matters more than it looks. A block often looks poor because the data to make
it good is not collected anywhere — and then the real finding is upstream, not visual.

## 6. Waves

Group the work so the first wave is shippable on its own and visibly changes the surface.

- **Wave 1** — blocks on the main path whose replacement needs no new data and no schema
  change. This is what gets executed in `AF` mode.
- **Wave 2** — blocks needing a new endpoint or a shared component built first.
- **Wave 3** — blocks needing data that is not collected yet, or a product decision.

List the shared components the waves imply. If six blocks all need the same empty state,
building it once is one task, not six — and it belongs before all of them.

## 7. Verification (AF mode)

A block is not done until: typecheck, lint and tests are green **from the repo root**; the
block is re-captured in every theme × both densities; contrast is re-measured; and the
finding records **before → after**. If a check cannot run, the status is `BLOCKED` with the
reason — not silence.

## 8. Agent anti-patterns

The work is rejected for any of these. They are listed because every one of them happened.

- "Let me rewrite it in `<library>`." No. A replacement for a block, not for the stack.
- Presenting a rearrangement as a redesign — see §2.3.
- A verdict with no `path:line` or no visual proof.
- "Found 47 hardcoded values" with no analysis of each. Some are legitimate, and saying
  which is the job.
- Calling a `TODO` a defect without saying what the user experiences.
- **A silent coverage limit.** Looked at 12 of 34 screens? Write that in the report header.
  An unstated sample reads as full coverage, which is the most expensive lie an audit can
  tell.
- Judging an empty screen as a design. Seed the data first.
- Concluding a feed is live from reading the code, without checking what production returns.
- Deciding a product question on the owner's behalf.
- Marking a block done without seeing it in the dark theme.
