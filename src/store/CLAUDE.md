# Store & State Rules

- **Scope-clear store naming**: When store actions serve one specific feature, name them to reflect that exact scope (e.g., `setDashboardChartRange`, not `setCustomRange`).
- **Persistence**: All persisted stores must use `createJSONStorage(() => idbStorage)` with `skipHydration: true`, starting at `version: 1`. A change to the persisted shape bumps the version and ships a `migrate`. Persist key format: `store-<name>` (e.g. `store-sessions`, `store-layout`). No store should use localStorage.
- **Sessions storage**: `store-sessions` persists through `guardedSessionsStorage` (`src/lib/guardedSessionsStorage.ts`, wrapping `idbStorage`) so a stale tab can't overwrite reprocessed sessions.
- **Testing Requirement**: Test persist migrations and non-trivial derived state; see `tests/CLAUDE.md`.
