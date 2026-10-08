# Reprocessing sessions when a calculation changes

Prerequisite for `plans/gap.md` (session GAP stays stored; old sessions need the new value).

## Context

- Values derived at import are stored on the session (`src/parsers/fit.ts:233-318`: gap, tss/stressMethod, normalizedPower, avg/max power, avgCadence, distance, maxSpeed fallback, movingTime, fingerprint …). A change in a calculation leaves old sessions stale.
- Raw FIT binaries are stored per session (`fit-files`, `src/lib/db.ts:57-59`) for file/ZIP and intervals.icu imports; demo sessions and imports from before DB v2 have none.
- A manual "Reimport all" exists (`src/features/settings/hooks/useReimport.ts`, `src/features/settings/DataManagementSection.tsx:43`); it re-derives everything incl. TSS with the current profile and overwrites names.
- No derivation version on sessions; no multi-tab coordination; the sessions store persists as one array, so a stale tab can overwrite a reprocessed one.
- Session titles: `useAutoSessionNames` toggle (`src/store/user.ts:14`, `:54-57`, `src/features/sessions/AutoSessionNamesToggle.tsx`, `src/features/sessions/hooks/useSessionTitle.ts:12`) and renaming (`src/features/sessions/session/RenameSessionDialog.tsx`, `renameSession` in `src/store/sessions.ts:34`, `:61`).

## Decisions (settled)

- **Derivation version** on every session; the app knows the current version. Sessions below it are reprocessed.
- **Source**: reparse the stored FIT; sessions without a FIT recompute what their stored records allow.
- **TSS is left alone**: reprocessing keeps each session's TSS (and stress method) from import, so past Load and fitness don't shift. Other derived values are updated.
- **UI**: on app start, if any session is outdated, a blocking screen reusing the onboarding's circular progress (`src/components/ui/ImportProgressOverlay.tsx`, mounted in `src/components/layout/AppLayout.tsx:15`) with a calm message ("Updating your sessions…" / "Einheiten werden aktualisiert…"); the user continues when it's done.
- **Removed features**:
  - Renaming sessions (`RenameSessionDialog.tsx`, the menu entry in `SessionActionsMenu.tsx`, `renameSession`).
  - The auto-generated names toggle (`AutoSessionNamesToggle.tsx`, `useAutoSessionNames` in `src/types/index.ts:27`, `src/store/user.ts`, `src/lib/defaults.ts:13`, `ThresholdsSection.tsx:95`, `generateDevData.ts:260`). Titles always use the source name (intervals.icu activity name or the name from the file); the fallback for a missing name stays as today.
  - "Reimport all" in Settings (`useReimport.ts`, its section in `DataManagementSection.tsx`, its messages) — replaced by the automatic reprocessing.
  - Persisted stores lose fields → version bump + migration (`src/store/CLAUDE.md`).

## Open

- Robustness details for the implementation: one runner across tabs (Web Lock), per-session commit so an interrupted run resumes, memory (one FIT at a time).

## Tests

- Reprocessing updates an outdated session's derived values and keeps its TSS.
- A session without a stored FIT is reprocessed from its records.
- An interrupted run resumes with the remaining sessions.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand: bump the version with existing data, the blocking progress screen appears and completes; renaming, the names toggle and "Reimport all" are gone.
