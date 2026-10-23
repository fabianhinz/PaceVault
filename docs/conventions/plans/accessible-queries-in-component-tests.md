---
id: accessible-queries-in-component-tests
tdr_reference: tdr/accessible-queries-in-component-tests.md
depends_on: [render-through-provider-helpers]
generated: 2026-10-23
---

# Accessible queries in component specs

Read `tdr/accessible-queries-in-component-tests.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`render-through-provider-helpers`](render-through-provider-helpers.md) — lifts the render-test ban and creates `renderWithProviders`, whose result is what these rules query; without it no component spec can exist to follow them.

## Changes

`apps/web/tests/` holds no component (`.spec.tsx`) spec today, and no spec uses `screen`, `*ByTestId`, `querySelector` or `findBy*` (all four Section 3 greps print nothing over `apps/web/tests/`). The change is the convention line that makes the first component spec follow the rules. No `CLAUDE.md:28` exemption is needed: the render result is bound whole (`const view = renderWithProviders(…)`) and queried through its name, in line with the no-destructuring rule at `CLAUDE.md:28`, which stays unchanged.

1. State the query rules in the testing strategy.
   Files: `apps/web/tests/CLAUDE.md` (one new bullet directly after the **Rendering** bullet that the render-helper plan adds after line 11)
   Change: Insert `- **Queries**: Component specs find elements the way a user does — \`getByRole\` (with an accessible \`name\`, never a positional index), \`getByText\`, \`getByLabelText\` and their \`queryBy\`/\`getAllBy\` forms — called on the render-helper result bound whole (\`const view = renderWithProviders(…)\`, \`view.getByRole(…)\`), never destructured and never through \`screen\`. \`*ByTestId\` only for elements with no accessible identity (spinner, presentational wrapper, \`iframe\`) or for a stub the spec renders from \`vi.mock\`; no \`container.querySelector\`. Wait with \`await waitFor(() => expect(…))\`, not \`findBy*\`; scope with \`within(node)\`. Never add a \`data-testid\` to app markup where a label or \`aria-label\` would do.`
   Check: `rg -n "\*\*Queries\*\*" apps/web/tests/CLAUDE.md` prints one line directly below the Rendering bullet.

## Open items

- None of R1–R6 has a violation to fix today; they bind the first `apps/web/tests/**/*.spec.tsx` written after the render-helper plan lands.
- Whether to standardise on `userEvent` over `fireEvent` is not settled by this record.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
