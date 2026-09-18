---
id: formatting-through-intl-namespace
tdr_reference: tdr/formatting-through-intl-namespace.md
generated: 2026-09-17
---

# User-facing date and locale formatting goes through the intl namespace

Read `tdr/formatting-through-intl-namespace.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`helpers-as-namespace-objects`](helpers-as-namespace-objects.md) — fixes the namespace-object form this record's R6 uses, and its own R2 would otherwise leave the formatters loose.

## Changes

1. Extract the `Intl.*` surface out of `src/lib/formatters.ts` into its own module.
   Files: new `src/lib/intl.ts`, `src/lib/formatters.ts`, new `tests/lib/intl.spec.ts`
   Change: move the three private `Intl.DateTimeFormat` instances (`dateFmt`, `dateTimeFmt`, `localDateFmt`) and the functions built on them (`formatDate`, `toDateString`, and `formatSubSport` if it uses a collator or a locale-aware comparison) into `src/lib/intl.ts`. Leave the pure numeric formatters — `formatDuration`, `formatLapTime`, `formatRaceTime`, `formatTimeHMS`, `formatDistance`, `toKm`, `formatPace`, `formatSpeed`, `formatPaceOrSpeed`, `formatPaceTick`, `formatPaceInput`, `parsePaceInput`, `parseTimeHMS`, `pbLabel`, `formatPBValue` — in `formatters.ts` as loose exports; they construct no `Intl` formatter and are not this record's subject.
   Check: `grep -n "Intl\." src/lib/formatters.ts` returns nothing; `pnpm test -- --run tests/lib` passes.

2. Publish the intl surface as one namespace object with a mode union.
   Files: `src/lib/intl.ts`
   Change: keep every formatter function module-private and export a single plain object literal named `intl`, built from shorthand references (R6). Replace the current options-bag parameter of `formatDate` with a closed mode union exported as a type — `'date' | 'time' | 'date-time' | 'precise'` — with a default mode (R3); the caller names a mode, not a field set. Add a shared collator instance as `intl.collator` (R4) and a singular/plural noun-phrase helper (R7).
   Check: `grep -c "^export" src/lib/intl.ts` returns 2 (the namespace object and the mode type); `pnpm check`.

3. Hold the locale inside the module, from Paraglide.
   Files: `src/lib/intl.ts`
   Change: the module reads the active locale from Paraglide's `getLocale()` and passes it to every `Intl.*` constructor. No exported method takes a locale argument, and no call site passes one (R5). The existing `localDateFmt`, which hardcodes `'en'`, is the one deliberate exception and only if its output is machine-facing — an ISO-ish key or a filename segment; if it is user-facing it moves onto `getLocale()` like the others, and if it is machine-facing it belongs in the module that consumes it, not here.
   Check: `grep -n "getLocale" src/lib/intl.ts` matches; no exported method signature contains a `locale` parameter; `pnpm test -- --run`.

4. Route the three bypassing call sites through the namespace.
   Files: `src/features/dashboard/LoadChart.tsx:145`, `src/lib/chartTheme.ts:34`, `src/components/ui/MetricLabel.tsx:28`
   Change: `d.toLocaleString(undefined, { month: 'short' })` and `d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })` become `intl.formatDate(...)` calls with the appropriate mode — add a mode for the short axis-label form rather than passing options through. `explanation.shortLabel.localeCompare(props.contextLabel, ...)` becomes `intl.collator.compare(...)`.
   Check: R2's grep returns nothing across `src/`; `pnpm check && pnpm test -- --run && pnpm exec playwright test e2e/dashboard.spec.ts`.

5. Confirm nothing else constructs an `Intl` formatter.
   Files: all of `src/`
   Change: run R1's signal. Any `new Intl.*` outside `src/lib/intl.ts` moves into it as a new mode or a new member. Machine-facing string comparison — sorting session ids, diffing, serialisation — is not presentation and must not be routed through the collator; leave those as plain comparisons.
   Check: R1's grep matches only `src/lib/intl.ts`; `pnpm check && pnpm build`.

## Open items

This record inverts one rule of the convention it was drawn from. That convention held the locale as a hardcoded literal because its application was English-only by construction. PaceVault is multi-locale through Paraglide, so the module reads the active locale from `getLocale()` instead — but the rest of R5 stands unchanged and is the point: the locale is decided *inside* the module, and no exported method accepts one. A later agent must not "improve" this by threading a locale parameter through call sites.

The numeric formatters left in `src/lib/formatters.ts` stay loose exports. The helpers-as-namespace-objects record's R2 covers them — their names already carry their topic — and this record's R6 applies only to the intl surface.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
