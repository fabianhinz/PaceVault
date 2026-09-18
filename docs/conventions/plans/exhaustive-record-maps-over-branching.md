---
id: exhaustive-record-maps-over-branching
tdr_reference: tdr/exhaustive-record-maps-over-branching.md
generated: 2026-09-17
---

# Exhaustive record maps for per-member values, exhaustive switches for per-member behaviour

Read `tdr/exhaustive-record-maps-over-branching.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Remove the `default` arm from every switch over a closed union.
   Files: `src/parsers/fit.ts:39`, `src/lib/prescription.ts:77`, `src/lib/prescription.ts:259`, `src/lib/coachingMessages.ts:7`, `src/lib/coachingMessages.ts:75`
   Change: read each switch. Where the discriminant is a closed union declared in this codebase, delete the `default` arm so an unhandled member fails the type check instead of falling through (R3). Where the discriminant is an *open* value — `src/parsers/fit.ts:39` switches on a raw FIT sport string, which arrives from a file and is not closed — the `default` is correct and stays; that switch instead needs its input narrowed to a union first, or it is out of scope. Decide per switch and say which in the commit message.
   Check: `pnpm check` fails if you delete a member from one of the closed unions and passes when you restore it — verify that on one union before moving on.

2. Convert value-returning switches into `Record<Union, T>` maps.
   Files: the switches from item 1 whose arms only return a value — a label, a colour token, an icon, a number — most likely `src/lib/coachingMessages.ts:7`
   Change: replace the switch with a single object literal typed `Record<Union, T>` declared next to the union it keys, and index it (R2, R9). Name it for both sides of the mapping (`MESSAGE_BY_STATUS`), not after the union alone. Keep a switch only where an arm has behaviour — a side effect, an early return, or a case reading fields only that member carries.
   Check: `pnpm check && pnpm test -- --run tests/lib/coachingMessages.spec.ts`.

3. Type each new map so the compiler checks exhaustiveness, and index it directly.
   Files: the maps created in item 2
   Change: annotate (`const x: Record<Union, T> = {…}`) when the value type is the point, or close with `} satisfies Record<Union, T>` when callers need the literal types of the entries — never both, never neither (R4). Index with `map[key]`, with no `??`, `?.` or default entry softening the lookup (R5).
   Check: `grep -nE "\\[[a-zA-Z]+\\] \\?\\?" src` returns nothing for the new maps; `pnpm check`.

4. Give every remaining closed union the `as const` declaration form.
   Files: every module declaring a closed string union in `src/`
   Change: R1 wants a union declared as a frozen `as const` object or array plus a derived type, so the member list exists as a runtime value the maps can be keyed by. `src/components/ui/Typography.tsx` already does this (`const variants = {…} as const; type TypographyVariants = keyof typeof variants`). Bring hand-written unions — `BannerVariant` in `src/components/ui/Banner.tsx` is one — into that form only where a runtime list is actually needed; a union with no runtime consumer may stay a direct `type X = 'a' | 'b'`.
   Check: `pnpm check && pnpm test -- --run`.

5. Replace any partial map that hides behind a widened key.
   Files: all of `src/`
   Change: run R6's detection. A map that genuinely cannot cover every member is declared `Partial<Record<Union, T>>` so the call site is forced to handle `undefined`. A map keyed `Record<string, T>` over what is really a closed union is the violation — narrow the key. R7 forbids reaching the same result by casting `Object.fromEntries(...) as Record<Union, T>`.
   Check: R6's and R7's greps return nothing; `pnpm check && pnpm test -- --run`.

## Open items

R1's ban on TypeScript enums is already satisfied: `grep -rn "enum " src` returns nothing, and `erasableSyntaxOnly` in `tsconfig.app.json` makes an enum a compile error, so the toolchain enforces that half. That is recorded as the rule's `enforcedBy` in the TDR reference; no tooling proposal is needed for it.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
