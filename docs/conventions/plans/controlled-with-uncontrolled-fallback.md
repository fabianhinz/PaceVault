---
id: controlled-with-uncontrolled-fallback
tdr_reference: tdr/controlled-with-uncontrolled-fallback.md
generated: 2026-09-17
---

# Controlled props with an uncontrolled fallback

Read `tdr/controlled-with-uncontrolled-fallback.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Identify the catalogue components that own interactive state.
   Files: every component under `src/components/ui/`
   Change: apply the record's own test — does this component call a state setter of its own? `SegmentedControl`, `ToggleButton`, `SlideIndicator` and the expand/collapse surfaces are the likely yes-answers. A thin Radix wrapper that forwards the whole question to the primitive underneath (`Switch`, `Tabs`, `Select`, `Slider`, `DropdownMenu`, `Popover`, `Dialog`) holds no state of its own and is out of scope — adding a parallel internal state there would produce two sources of truth. Write the verdict per component before changing code.
   Check: the list covers every component under `src/components/ui/` and names in-scope or out-of-scope for each, with the state setter that decided it.

2. Declare the full triple on each in-scope component.
   Files: the in-scope components' `types.ts` and implementations
   Change: R1 — expose exactly three props for the state: `default<State>` seeds it, `<state>` controls it, `on<State>Change` reports it. Declare all three together; never ship a subset. R2 — name all three after the state itself, with no `is`/`has` prefix on the controlled prop and the callback as `on` + the same name + `Change`, present tense. R3 — mark all three optional and give the state a hard-coded fallback, so the component renders and stays interactive when none is passed; never require the change callback.
   Check: each in-scope component's types module declares the three props together; `pnpm check`.

3. Seed the internal state once, from the coalesced chain.
   Files: the in-scope components' implementations
   Change: R4 — seed internal state in the state initialiser from `<state> ?? default<State> ?? <fallback>`. Do not apply the seed from a mount effect, and do not seed from the default alone. The effects record is removing exactly that mount-effect pattern elsewhere in the codebase; do not reintroduce it here.
   Check: no in-scope component seeds state in a `useEffect`; `pnpm check && pnpm test -- --run`.

4. Push the controlled prop in from a layout-phase effect.
   Files: the in-scope components' implementations
   Change: R5 — keep the internal state as the single value the render reads, and push the controlled prop into it from a layout-phase effect that returns early while the controlled prop is `undefined`. Do not resolve the mode inline on each render by coalescing the prop over the internal value. This is the one place the effects record's R2 does not apply: the effect synchronises with a *prop* a parent owns, which is the external system here, and it is stated as a rule rather than tolerated as an exception.
   Check: `pnpm check && pnpm exec playwright test`; drive one such component from a parent's state and confirm it follows.

5. Report every internal transition.
   Files: the in-scope components' implementations
   Change: R6 — call `on<State>Change` on every internal transition, unconditionally and after the internal setter, so an observer gets the same events as an owner without having to take ownership. R7 — a purely presentational transient (a hover, press or focus flag read only by the class layer) gets no props at all; qualify a state for the triple only when a consumer could plausibly need to read it, set it, restore it, or keep it in step with another component.
   Check: `pnpm check && pnpm test -- --run && pnpm exec playwright test`.

## Open items

Most of this catalogue wraps Radix, and Radix already implements this exact triple (`defaultValue` / `value` / `onValueChange`). For those wrappers the correct action is to relay the three props straight through and add no internal state — that is the first out-of-scope category in item 1, and getting that classification right is most of this plan's value. The components this record actually changes are the few that own state React-side rather than delegating it.

Scope is `src/components/ui/` only. A feature component with one call site is not a public prop surface and does not owe the triple.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
