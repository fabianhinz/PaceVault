---
id: helpers-as-namespace-objects
tdr_reference: tdr/helpers-as-namespace-objects.md
generated: 2026-10-23
---

# Helpers with generic names are exposed as one namespace object

Read `tdr/helpers-as-namespace-objects.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

Run every item from the repo root. "Clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error.

1. Publish the session stat formatters as one `statFormat` object.
   Files: `apps/web/src/features/sessions/session/statFormat.ts`, `apps/web/src/features/sessions/session/PeakBars.tsx`, `apps/web/src/features/sessions/session/PeakPowerCell.tsx`, `apps/web/src/features/sessions/session/HrZonesCell.tsx`, `apps/web/src/features/sessions/session/MoreStatsRow.tsx`, `apps/web/src/features/sessions/session/lapLabels.ts`
   Change: The module exports bare `watts`, `duration`, `percent`, `peakWindow` and the formatter object `integerFmt`; `duration` and `percent` are generic, and `watts` already collides with the `props.watts` field in `PeakBars.tsx`. Make all of them module-local, add `const integer = (value: number): string => integerFmt.format(value);`, and end the module with the only export:

   ```ts
   export const statFormat = {
     watts,
     duration,
     percent,
     peakWindow,
     integer,
   };
   ```

   Call sites import `{ statFormat }` from `./statFormat.ts` and call `statFormat.watts(value)`, `statFormat.duration(seconds)`, `statFormat.percent(share)`, `statFormat.peakWindow(seconds)`; the three `integerFmt.format(x)` calls in `MoreStatsRow.tsx` (lines 87, 119, 237) become `statFormat.integer(x)`. If the formatting-through-intl plan has already moved the `Intl.NumberFormat` constructions into `apps/web/src/lib/formatters.ts`, the members wrap those imports instead; the object stays the same.
   Check: `rg -n "^export" apps/web/src/features/sessions/session/statFormat.ts` prints exactly one line, `export const statFormat = {`; `rg -n "integerFmt" apps/web/src/features/sessions/session --glob '!statFormat.ts' --glob '!WeatherHourlyTable.tsx'` prints nothing; clean `vp check`.

2. Declare the crash debug commands before listing them, and keep the object the module's only export.
   Files: `apps/web/src/lib/debug/crashCommands.ts`, `apps/web/src/lib/debug/crashSignal.ts`, `apps/web/src/lib/debug/pvDebug.ts`
   Change: `crashCommands` (`crashCommands.ts:12-21`) builds its members from inline arrow literals, and the module also exports `throwIfBootCrashRequested` and `crashCommandDocs`. Move `BOOT_CRASH_FLAG` and `throwIfBootCrashRequested` into `crashSignal.ts` (the crash-signal topic, whose loose exports already carry their topic in the name) and add there `export const requestBootCrash = () => { sessionStorage.setItem(BOOT_CRASH_FLAG, '1'); };`. In `crashCommands.ts` declare `const crashRoot = () => triggerCrash('root');`, `const crashRoute = () => triggerCrash('route');`, `const crashMap = () => triggerCrash('map');`, `const crashBoot = () => { requestBootCrash(); window.location.reload(); };`, `const reportUrl = (error?: unknown) => buildIssueUrl(error ?? new Error('pvDebug: test report'));` and export `export const crashCommands = { crashRoot, crashRoute, crashMap, crashBoot, reportUrl };`. Move the five `crashCommandDocs` strings into the `commandDocs` literal in `pvDebug.ts` (today `{ ...crashCommandDocs, ...migrationCommandDocs }`, `pvDebug.ts:10-13`), keeping its `Record<keyof typeof commands, string>` annotation so a missing entry stays a type error, and keeping the strings verbatim and in today's order (crash commands first, then `rerunMigration`) so `pvDebug.help()` prints exactly what it prints today; `pvDebug.ts` imports `throwIfBootCrashRequested` from `./crashSignal.ts`.
   Check: `rg -n "^export" apps/web/src/lib/debug/crashCommands.ts` prints exactly `export const crashCommands = {`; `sed -n '/^export const crashCommands = {/,/^};/p' apps/web/src/lib/debug/crashCommands.ts` shows only shorthand member lines (`crashRoot,` …) between the braces; clean `vp check`; in `vp dev`, `pvDebug.help()` in the browser console still lists all six commands.

3. Keep the migration debug object the module's only export.
   Files: `apps/web/src/lib/debug/migrationCommands.ts`, `apps/web/src/lib/debug/outdatedSessions.ts` (new), `apps/web/src/lib/debug/pvDebug.ts`, `apps/web/tests/lib/debug/migrationCommands.spec.ts` → `apps/web/tests/lib/debug/outdatedSessions.spec.ts`
   Change: `migrationCommands.ts` also exports `markSessionsOutdated` (`:17`, read by its spec) and `migrationCommandDocs` (`:60`). Move `SESSIONS_PERSIST_KEY`, `OUTDATED_VERSION`, `persistedSessionsSchema`, the `PersistedSessions` type and `markSessionsOutdated` into the new topic module `outdatedSessions.ts` (export `markSessionsOutdated`, `persistedSessionsSchema`, `SESSIONS_PERSIST_KEY`, `OUTDATED_VERSION` as `rerunMigration` needs them). `migrationCommands.ts` keeps `rerunMigration` module-local and exports only `export const migrationCommands = { rerunMigration };`. Move the `rerunMigration` doc string verbatim into the `commandDocs` literal in `pvDebug.ts`, after the five crash entries. Rename the spec to `outdatedSessions.spec.ts` and import `markSessionsOutdated` from `@/lib/debug/outdatedSessions.ts`.
   Check: `rg -n "^export" apps/web/src/lib/debug/migrationCommands.ts` prints exactly `export const migrationCommands = {`; `vp run test` passes, including `outdatedSessions.spec.ts`; clean `vp check`.

## Open items

- Loose-export modules whose function names already carry their topic stay loose (R2): `apps/web/src/lib/railFormat.ts` (`rail*`), `apps/web/src/lib/debug/crashSignal.ts`, `apps/web/src/lib/recordCodec.ts`, and the rest of `apps/web/src/lib`.
- `apps/web/src/lib/formatters.ts` keeps loose named exports by owner decision; it is not turned into a namespace object.
- Constant tables and keyed maps that look like objects (`chartTheme` in `lib/chartTheme.ts`, `acwrColorMap`/`acwrFill` in `lib/statusColors.ts`, `trackModifiers`/`studioRouteModifiers` in `features/map/trackColors.ts`) are not namespaces and keep their `as const` / `Record<>` shape.
- The store `toast` helper (`apps/web/src/store/toast.ts:29`) is not this plan's work: the snackbar-feedback-via-feature-maps plan deletes it and raises feedback through `useSnackbar()`.
- `packages/ui`: already conforms — every `src/lib/` helper name carries its topic (`computeSheetLayout`, `scrollFadeEdges`, `highlightRect`), so they stay loose exports (R2).

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
